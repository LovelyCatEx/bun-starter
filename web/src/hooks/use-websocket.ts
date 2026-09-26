import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

import {
  getWebSocketClient,
  type WebSocketClient,
  type WsHandler,
  type WsStatus,
} from '@/api/websocket'

/**
 * 连接状态的统一入口，配 `web/src/api/websocket.ts` 的客户端用。
 *
 * ```tsx
 * const { t } = useLanguage()
 * const { connected, send } = useWebSocket({
 *   handlers: { 'chat.message': (message) => append(message) },
 * })
 *
 * await send('chat.send', { text })
 * ```
 *
 * 连接是**全应用共享**的：挂载时连上，卸载**不断开**（别的组件可能还在用），要断连就在
 * 该断的地方 `getWebSocketClient().disconnect()`（比如退出登录、或调试页的开关）。
 */

export interface UseWebSocketOptions {
  /** 用哪条连接，默认共享的那条；第二个后端才需要传 */
  client?: WebSocketClient
  /**
   * 声明式订阅：key 是事件名，value 是处理函数。
   * 只在事件名集合变化时重新订阅，所以每帧都新建对象也不会反复解绑 —— 处理函数走 ref 取最新的闭包。
   */
  handlers?: Record<string, WsHandler>
  /** 挂载时自动连接，默认 true */
  autoConnect?: boolean
}

export interface UseWebSocketResult {
  status: WsStatus
  /** `status === 'open'`，渲染上更常用 */
  connected: boolean
  /** 发请求等应答，失败 reject 一个 `WsError`（`code < 0` 是客户端侧失败，见 `WS_CLIENT_ERROR`） */
  send: <T>(event: string, data?: unknown) => Promise<T>
  /** 单向帧，不等应答 */
  notify: (event: string, data?: unknown) => void
  /** 手动订阅（要订阅的事件名是动态的时候用），返回取消订阅的函数 */
  on: <T = unknown>(event: string, handler: WsHandler<T>) => () => void
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketResult {
  const client = options.client ?? getWebSocketClient()
  const autoConnect = options.autoConnect ?? true

  // 客户端就是个外部 store：`useSyncExternalStore` 会在订阅之后再读一次快照，
  // 所以"首次渲染和订阅之间状态变了"这种情况天然不会漏，不需要自己补一次 setState。
  const subscribeStatus = useCallback(
    (onStoreChange: () => void) => client.onStatus(onStoreChange),
    [client],
  )
  const readStatus = useCallback(() => client.status, [client])

  const status = useSyncExternalStore(subscribeStatus, readStatus, readStatus)

  const handlersRef = useRef(options.handlers)

  useEffect(() => {
    handlersRef.current = options.handlers
  })

  useEffect(() => {
    if (autoConnect) client.connect()
  }, [client, autoConnect])

  // 依赖 keys 而不是对象本身：handlers 通常是内联字面量，每帧都是新引用。
  const events = options.handlers ? Object.keys(options.handlers).sort().join('\n') : ''

  useEffect(() => {
    if (!events) return

    const offs = events.split('\n').map((event) =>
      client.on(event, (data, frame) => {
        handlersRef.current?.[event]?.(data, frame)
      }),
    )

    return () => {
      for (const off of offs) off()
    }
  }, [client, events])

  const send = useCallback(
    <T,>(event: string, data?: unknown) => client.send<T>(event, data),
    [client],
  )

  const notify = useCallback(
    (event: string, data?: unknown) => {
      client.notify(event, data)
    },
    [client],
  )

  const on = useCallback(
    <T = unknown>(event: string, handler: WsHandler<T>) => client.on(event, handler),
    [client],
  )

  return { status, connected: status === 'open', send, notify, on }
}
