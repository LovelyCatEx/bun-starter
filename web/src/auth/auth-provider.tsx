import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
} from '@/api/auth/auth'
import type { AuthUserVo } from '@/api/auth/vo/auth-user.vo'
import { setUnauthorizedHandler } from '@/api/requests'

import { AUTH_MODE } from './auth-mode'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'
import { getToken } from './token-store'

/** cookie 模式下 JS 读不到 token，只能问后端；localstorage 模式下没 token 就一定是未登录。 */
async function loadCurrentUser(): Promise<AuthUserVo | null> {
  if (AUTH_MODE === 'localstorage' && !getToken()) {
    return null
  }

  try {
    return await getMe()
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUserVo | null>(null)

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const current = await loadCurrentUser()

      if (cancelled) return

      setUser(current)
      setStatus(current ? 'authenticated' : 'unauthenticated')
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // 任何请求拿到 401（token 过期/被清）都回到登录页
    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus('unauthenticated')
      navigate('/login', { replace: true })
    })

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [navigate])

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginRequest({ username, password })

    setUser(result.user)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
