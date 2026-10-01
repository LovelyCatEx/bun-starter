export type AuthMode = 'cookie' | 'localstorage'

const raw = import.meta.env.VITE_AUTH_MODE

/** 只影响前端的 token 取值路径：后端两种传输都接受（见 frontend.md「认证」）。 */
export const AUTH_MODE: AuthMode =
  raw === 'localstorage' ? 'localstorage' : 'cookie'
