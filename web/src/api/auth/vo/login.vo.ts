import type { AuthUserVo } from './auth-user.vo'

export interface LoginVo {
  token: string
  user: AuthUserVo
}
