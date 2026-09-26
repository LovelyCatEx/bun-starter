import { get, post } from '@/api/system-requests'
import { clearToken, setToken } from '@/auth/token-store'

import type { LoginDto } from './dto/login.dto'
import type { AuthUserVo } from './vo/auth-user.vo'
import type { LoginVo } from './vo/login.vo'

export async function login(body: LoginDto): Promise<LoginVo> {
  const result = await post<LoginVo>('/api/auth/login', body)

  // cookie 模式下是 no-op，token 已经在 httpOnly cookie 里
  setToken(result.token)

  return result
}

export async function logout(): Promise<void> {
  try {
    await post<null>('/api/auth/logout')
  } finally {
    clearToken()
  }
}

export function getMe(): Promise<AuthUserVo> {
  return get<AuthUserVo>('/api/auth/me')
}
