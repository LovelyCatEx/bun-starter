import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useLanguage } from '@/hooks/use-language'

import { useAuth } from './use-auth'

/** 受保护路由的守卫：登录态未判定完就先占位，未登录回登录页并记住来源。 */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()
  const { t } = useLanguage()

  if (status === 'loading') {
    return (
      <main className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        {t('component.require-auth.loading')}
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
