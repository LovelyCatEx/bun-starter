import { AUTH_MODE } from './auth-mode'

const STORAGE_KEY = 'auth_token'

/**
 * token 读写的唯一入口。
 *
 * cookie 模式下 token 由后端写进 httpOnly cookie，JS 既读不到也不需要写，
 * 所以三个方法都是 no-op，登录态只能靠 `GET /api/auth/me` 判断。
 */
export function getToken(): string | null {
  return AUTH_MODE === 'localstorage' ? localStorage.getItem(STORAGE_KEY) : null
}

export function setToken(token: string): void {
  if (AUTH_MODE === 'localstorage') localStorage.setItem(STORAGE_KEY, token)
}

export function clearToken(): void {
  if (AUTH_MODE === 'localstorage') localStorage.removeItem(STORAGE_KEY)
}
