export type AuthMode = 'cookie' | 'localstorage'

const raw = import.meta.env.VITE_AUTH_MODE

/**
 * 认证方式由 web/.env 的 `VITE_AUTH_MODE` 决定，缺省或写错都回退为更安全的 cookie。
 * 后端始终同时接受 cookie 与 `Authorization: Bearer`，因此这里只影响前端的取值路径。
 */
export const AUTH_MODE: AuthMode =
  raw === 'localstorage' ? 'localstorage' : 'cookie'
