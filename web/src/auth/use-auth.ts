import { useContext } from 'react'

import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'

/** 读取当前登录态与 login/logout，必须在 `<AuthProvider>` 内使用。 */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }

  return value
}
