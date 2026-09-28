import { AUTH_MODE } from '@/auth/auth-mode'
import { useAuth } from '@/auth/use-auth'
import { AnimatedBadge } from '@/components/motion/animated-badge'
import { Button } from '@/components/motion/button'
import { useLanguage } from '@/hooks/use-language'

import { APP_NAME, APP_VERSION } from '../../../app.config'

export function HomePage() {
  const { t, toggleLanguage } = useLanguage()
  const { user, logout } = useAuth()

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      {/*
        beUI 没有 card 原语，所以这张容器手写：底色 `bg-card`、边框 `border-border`，
        四档暗色（light / 深黑 / 深灰 / 浅灰）跟着 token 自己走。
      */}
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card text-sm text-card-foreground">
        <div className="grid auto-rows-min items-start gap-1 p-4">
          <div className="flex items-center justify-between gap-2 font-heading text-base font-medium leading-snug">
            {t('home.title')}
            <AnimatedBadge status="neutral">{user?.username}</AnimatedBadge>
          </div>
          <p className="text-sm text-muted-foreground">{t('home.description')}</p>
        </div>

        <div className="space-y-1 px-4 pb-4 text-sm text-muted-foreground">
          <p>{t('home.signedInAs', { name: user?.name ?? '' })}</p>
          <p>{t('home.authMode', { mode: AUTH_MODE })}</p>
          <p>{t('home.version', { name: APP_NAME, version: APP_VERSION })}</p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/50 p-4">
          <Button variant="ghost" onClick={toggleLanguage}>
            {t('common.switchTo')}
          </Button>
          <Button variant="ghost" onClick={() => void logout()}>
            {t('common.signOut')}
          </Button>
        </div>
      </div>
    </main>
  )
}
