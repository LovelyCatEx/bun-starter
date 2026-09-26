import { getToken } from '@/auth/token-store'

type QueryValue = string | number | boolean | null | undefined

export interface RequestConfig extends Omit<RequestInit, 'body' | 'method'> {
  query?: Record<string, QueryValue>
  body?: unknown
}

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(`HTTP ${status}${message ? ` ${message}` : ''}`)
    this.name = 'HttpError'
    this.status = status
  }
}

let unauthorizedHandler: (() => void) | null = null

/**
 * 注册全局 401 回调（由 AuthProvider 注入：清登录态并跳转 /login），
 * 这样每个调用点都不必自己处理登录过期。
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

function withQuery(url: string, query?: Record<string, QueryValue>): string {
  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.append(key, String(value))
  }

  const queryString = params.toString()
  if (!queryString) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${queryString}`
}

function isJsonBody(body: unknown): boolean {
  if (body === undefined || typeof body === 'string') return false
  return !(
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams
  )
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined
  if (typeof body === 'string') return body
  if (body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams) {
    return body
  }
  return JSON.stringify(body)
}

/** 后端错误响应是 `{ code, message, data }`，把 message 透出来比 `HTTP 401` 有用得多。 */
function apiMessage(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined

  const { message } = payload as { message?: unknown }

  return typeof message === 'string' && message ? message : undefined
}

async function request<T>(
  method: string,
  url: string,
  config: RequestConfig = {},
): Promise<T> {
  const { query, body, headers, ...init } = config

  const target = withQuery(url, query)

  console.log(`<<< ${method} ${target}`, body)

  // cookie 模式下 token 由 httpOnly cookie 携带，getToken() 返回 null，
  // 但 credentials 仍然要带上，否则跨域时 cookie 不会被发送。
  const token = getToken()

  const response = await fetch(target, {
    method,
    credentials: 'include',
    headers: {
      ...(isJsonBody(body) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: serializeBody(body),
    ...init,
  })

  const text = await response.text()

  let payload: unknown
  if (!text) {
    payload = undefined
  } else {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  console.log(`>>> ${method} ${target}`, payload)

  // 登录接口自己会说"账号密码错"，不该触发登录过期流程。
  if (response.status === 401 && !target.includes('/api/auth/login')) {
    unauthorizedHandler?.()
  }

  if (!response.ok) {
    throw new HttpError(
      response.status,
      apiMessage(payload) ?? response.statusText,
    )
  }

  return payload as T
}

export function doGet<T>(url: string, config?: RequestConfig): Promise<T> {
  return request<T>('GET', url, config)
}

export function doPost<T>(
  url: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  return request<T>('POST', url, { ...config, body })
}

export function doPut<T>(
  url: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  return request<T>('PUT', url, { ...config, body })
}

export function doPatch<T>(
  url: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  return request<T>('PATCH', url, { ...config, body })
}

export function doDelete<T>(url: string, config?: RequestConfig): Promise<T> {
  return request<T>('DELETE', url, config)
}
