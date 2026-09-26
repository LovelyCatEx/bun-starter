import type { WsRequest } from '@shared/protocol/ws-request'
import type { WsResponse } from '@shared/protocol/ws-response'
import { WS_PING, WS_PONG } from '@shared/protocol/ws-events'

import { AUTH_MODE } from '@/auth/auth-mode'
import { getToken } from '@/auth/token-store'

/**
 * 前端唯一的长连接入口，`requests.ts` 的 WS 版本。
 *
 * 和后端的一对帧对应（`WsRequest` / `WsResponse`，都来自 `@shared/protocol/`，不是两端各抄一份）：
 * 发出去的是 `{ id, event, data }`，收到的是 `{ id, event, code, message, data }`，`code === 0`
 * 表示成功、其余是后端异常的 `code`，与 HTTP 的 `{ code, message, data }` 是同一套语义。
 *
 * `id` 让一个连接上同时飞多个请求也能各回各家，所以：
 *
 * - `send(event, data)` —— 有去有回，`id` 由客户端生成，返回一个 Promise（超时 / 连接断掉 / `code !== 0` 都会 reject）
 * - `notify(event, data)` —— 单向，不带 `id`，不等回答
 * - `on(event, handler)` —— 订阅服务端推送（也包含"id 对不上任何在途请求"的帧）
 *
 * 重连与心跳默认开着：断开后按指数退避重连（`reconnectMinDelay` → `reconnectMaxDelay`），
 * 连着时定时发一帧 `ping`，服务端应回 `pong`；超过两个心跳周期没收到任何帧就认为连接已死，
 * 主动断开重连。要长期不重连就 `disconnect()`（这点和 fetch 不同，它不会自己停）。
 */

export type WsStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed'

/** 处理函数收到的是应答 / 推送里的 `data`，第二个参数是整帧（要看 `code` / `message` 时用）。 */
export type WsHandler<T = unknown> = (data: T, frame: WsResponse<T>) => void

/** 客户端侧的失败码：**负数**都来自客户端（没连上 / 超时 / 被断开），不来自服务端。 */
export const WS_CLIENT_ERROR = -1

export class WsError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'WsError'
    this.code = code
  }
}

export interface WebSocketClientOptions {
  /** 连接路径，必须以 `/` 开头（开发时 vite 代理到后端，单端口打包时同源）；也可直接给 `ws://` / `wss://` 全量地址 */
  path?: string
  /** 断开后是否自动重连，默认 true */
  reconnect?: boolean
  /** 首次重连延迟，之后每次翻倍，默认 500ms */
  reconnectMinDelay?: number
  /** 重连延迟上限，默认 15000ms */
  reconnectMaxDelay?: number
  /** 心跳周期，默认 25000ms */
  heartbeatInterval?: number
  /** 单个请求的等待上限，默认 15000ms */
  requestTimeout?: number
  /** 打印收发的每一帧（开发排查用） */
  log?: boolean
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: WsError) => void
  timer: ReturnType<typeof setTimeout>
}

/**
 * `?token=` 只给 localstorage 模式用：浏览器不能给 WebSocket 加自定义头，
 * 而 cookie 模式下 token 在 httpOnly cookie 里，浏览器自己会带上。
 * 后端只在"升级请求"上接受这种 token（见 `modules/auth/interceptor/auth.interceptor.ts`）。
 */
function withToken(url: string): string {
  if (AUTH_MODE !== 'localstorage') return url

  const token = getToken()
  if (!token) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}token=${encodeURIComponent(token)}`
}

/**
 * 根相对路径 → 全量地址。开发和单端口打包都是同源，所以协议与主机直接取当前的，
 * 只有 http/https 要换成 ws/wss。
 */
function resolveUrl(path: string): string {
  if (path.startsWith('ws://') || path.startsWith('wss://')) return withToken(path)

  if (typeof window === 'undefined') {
    throw new Error(`cannot resolve "${path}" outside a browser`)
  }

  const { protocol, host } = window.location
  return withToken(`${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}${path}`)
}

export class WebSocketClient {
  private readonly path: string
  private readonly reconnect: boolean
  private readonly reconnectMinDelay: number
  private readonly reconnectMaxDelay: number
  private readonly heartbeatInterval: number
  private readonly requestTimeout: number
  private readonly log: boolean

  private socket: WebSocket | null = null
  private currentStatus: WsStatus = 'idle'
  private closedByUser = false
  private attempt = 0
  private seq = 0
  private lastFrameAt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null

  private readonly pending = new Map<string, PendingRequest>()
  private readonly handlers = new Map<string, Set<WsHandler>>()
  private readonly statusHandlers = new Set<(status: WsStatus) => void>()

  constructor(options: WebSocketClientOptions = {}) {
    this.path = options.path ?? '/api/ws'
    this.reconnect = options.reconnect ?? true
    this.reconnectMinDelay = options.reconnectMinDelay ?? 500
    this.reconnectMaxDelay = options.reconnectMaxDelay ?? 15000
    this.heartbeatInterval = options.heartbeatInterval ?? 25000
    this.requestTimeout = options.requestTimeout ?? 15000
    this.log = options.log ?? false
  }

  get url(): string {
    return resolveUrl(this.path)
  }

  get status(): WsStatus {
    return this.currentStatus
  }

  /** 幂等：已经连着或正在连就什么都不做。 */
  connect(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return

    this.closedByUser = false
    this.setStatus(this.attempt === 0 ? 'connecting' : 'reconnecting')

    const socket = new WebSocket(this.url)
    this.socket = socket

    socket.onopen = () => {
      this.attempt = 0
      this.lastFrameAt = Date.now()
      this.setStatus('open')
      this.startHeartbeat()
    }

    socket.onmessage = (event: MessageEvent) => {
      this.handleFrame(event.data)
    }

    socket.onclose = () => {
      this.stopHeartbeat()
      this.socket = null
      // 连接都没了，在途的请求不会再有回答：立刻失败掉，别让调用点等到超时。
      this.rejectPending(WS_CLIENT_ERROR, 'websocket closed before the reply arrived')

      if (this.closedByUser || !this.reconnect) {
        this.setStatus('closed')
        return
      }

      this.scheduleReconnect()
    }

    // 出错之后 close 一定会跟着来，重连逻辑统一放在 onclose 里，这里不重复处理。
    socket.onerror = () => {
      this.debug('error')
    }
  }

  /**
   * 主动断开，并**停止重连**（连接是共享的，谁开的谁负责关）。
   * 只挂载不断开的场景请用 `on` / `send`，不要在 `useEffect` 卸载里调它。
   */
  disconnect(): void {
    this.closedByUser = true
    this.clearReconnectTimer()
    this.stopHeartbeat()
    this.attempt = 0

    this.rejectPending(WS_CLIENT_ERROR, 'websocket closed by the client')

    const socket = this.socket
    this.socket = null

    if (socket) {
      socket.onopen = null
      socket.onmessage = null
      socket.onclose = null
      socket.onerror = null
      socket.close(1000, 'client disconnect')
    }

    this.setStatus('closed')
  }

  /**
   * 发一个请求并等它的应答。失败时 reject 一个 `WsError`：
   * `code === WS_CLIENT_ERROR` 是客户端侧的失败（没连上 / 超时 / 被断开），
   * 其余是服务端返回的 `code`（与 HTTP 的 `ApiException.code` 同一套）。
   */
  send<T>(event: string, data?: unknown): Promise<T> {
    const socket = this.socket

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(
        new WsError(WS_CLIENT_ERROR, `websocket is not open (${this.currentStatus})`),
      )
    }

    const id = this.nextId()

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new WsError(WS_CLIENT_ERROR, `no reply for "${event}" within ${this.requestTimeout}ms`))
      }, this.requestTimeout)

      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      })

      this.write({ id, event, data })
    })
  }

  /** 单向帧：不带 `id`，不等应答（心跳、typing 这类不需要回答的都用它）。 */
  notify(event: string, data?: unknown): void {
    this.write({ id: null, event, data })
  }

  /** 订阅某个事件的帧，返回取消订阅的函数。 */
  on<T = unknown>(event: string, handler: WsHandler<T>): () => void {
    const set = this.handlers.get(event) ?? new Set<WsHandler>()
    set.add(handler as WsHandler)
    this.handlers.set(event, set)

    return () => {
      set.delete(handler as WsHandler)
      if (set.size === 0) this.handlers.delete(event)
    }
  }

  /** 订阅连接状态（`connecting` / `open` / `reconnecting` / `closed`），返回取消订阅的函数。 */
  onStatus(handler: (status: WsStatus) => void): () => void {
    this.statusHandlers.add(handler)

    return () => {
      this.statusHandlers.delete(handler)
    }
  }

  private nextId(): string {
    this.seq += 1
    return `${Date.now().toString(36)}-${this.seq}`
  }

  /** 发出去的形状就是共享的 `WsRequest` —— 字段名只有那一处定义。 */
  private write(frame: WsRequest): void {
    const socket = this.socket

    if (!socket || socket.readyState !== WebSocket.OPEN) return

    this.debug('>>>', frame)
    socket.send(JSON.stringify(frame))
  }

  private handleFrame(raw: unknown): void {
    if (typeof raw !== 'string') {
      // 协议只有 JSON 文本帧，二进制说明对面不是这套协议。
      this.debug('ignored a non-text frame')
      return
    }

    let frame: WsResponse

    try {
      frame = JSON.parse(raw) as WsResponse
    } catch {
      this.debug('ignored a frame that is not JSON', raw)
      return
    }

    if (typeof frame?.event !== 'string') {
      this.debug('ignored a frame without an event', raw)
      return
    }

    this.debug('<<<', frame)
    this.lastFrameAt = Date.now()

    if (frame.id !== null && frame.id !== undefined) {
      const pending = this.pending.get(frame.id)

      if (pending) {
        this.pending.delete(frame.id)
        clearTimeout(pending.timer)

        if (frame.code === 0) pending.resolve(frame.data)
        else pending.reject(new WsError(frame.code, frame.message))

        return
      }
    }

    // 心跳的应答只是"连接还活着"的证据，不往业务 handler 送。
    if (frame.event === WS_PONG) return

    for (const handler of this.handlers.get(frame.event) ?? []) {
      handler(frame.data, frame)
    }
  }

  private rejectPending(code: number, message: string): void {
    for (const [id, pending] of this.pending) {
      this.pending.delete(id)
      clearTimeout(pending.timer)
      pending.reject(new WsError(code, message))
    }
  }

  private scheduleReconnect(): void {
    this.setStatus('reconnecting')
    this.clearReconnectTimer()

    const base = Math.min(this.reconnectMaxDelay, this.reconnectMinDelay * 2 ** this.attempt)
    // 加抖动，避免服务端重启后所有客户端在同一刻一起回来。
    const delay = base + Math.random() * base * 0.3
    this.attempt += 1

    this.debug(`reconnecting in ${Math.round(delay)}ms`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) return

    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      const socket = this.socket

      if (!socket || socket.readyState !== WebSocket.OPEN) return

      // 两个周期都没有任何帧进来：对端多半已经没了，而半死的 TCP 不会自己报错，
      // 不主动断开就会永远停在"看起来连着"的状态。
      if (Date.now() - this.lastFrameAt > this.heartbeatInterval * 2) {
        this.debug('no frame for two heartbeats, dropping the connection')
        socket.close()
        return
      }

      this.notify(WS_PING)
    }, this.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer === null) return

    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  private setStatus(status: WsStatus): void {
    if (this.currentStatus === status) return

    this.currentStatus = status

    for (const handler of this.statusHandlers) {
      handler(status)
    }
  }

  private debug(...parts: unknown[]): void {
    if (!this.log) return

    console.log('[ws]', ...parts)
  }
}

let shared: WebSocketClient | null = null

/**
 * 全应用共享的那一个连接。聊天 / 推送这类"一个页面只该有一条长连接"的场景都用它，
 * 多个组件同时 `useWebSocket()` 也不会各开一条 —— 连接是稀缺资源，也是服务端的连接数。
 *
 * 要接第二条连接（比如另一个后端的 WS）就自己 `new WebSocketClient({ path })`。
 */
export function getWebSocketClient(options?: WebSocketClientOptions): WebSocketClient {
  shared ??= new WebSocketClient(options)

  return shared
}
