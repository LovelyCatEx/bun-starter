/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 认证方式：cookie | localstorage，非法或缺省时回退 cookie（见 src/auth/auth-mode.ts） */
  readonly VITE_AUTH_MODE?: string
}
