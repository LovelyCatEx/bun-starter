import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { Button } from '@/components/motion/button'
import { Input } from '@/components/motion/input'
import { useLanguage } from '@/hooks/use-language'
import { useToast } from '@/hooks/use-toast'

interface LoginLocationState {
  from?: string
}

export function LoginPage() {
  const { t, toggleLanguage } = useLanguage()
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 被守卫拦下来的路由，登录成功后直接回去
  const from = (location.state as LoginLocationState | null)?.from ?? '/'

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (err) {
      // 文案在这里就翻好：toast 弹出那一刻的快照，之后切语言不改写已经弹出来的那条
      toast.error(
        t('auth.login.failed', {
          error: err instanceof Error ? err.message : 'unknown error',
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      {/* 容器与 home.tsx 那张卡片同款（beUI 没有 card 原语，手写 token；见那边的注释） */}
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card text-sm text-card-foreground">
        <div className="grid auto-rows-min items-start gap-1 p-4">
          <h1 className="font-heading text-base font-medium leading-snug">
            {t('auth.login.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('auth.login.description')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-4 pb-4">
            {/* beUI 的 Input 自带 label（并且把 htmlFor 接到自己的 id 上），不用再写 Label */}
            <Input
              id="username"
              name="username"
              label={t('auth.login.username')}
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={setUsername}
            />

            <Input
              id="password"
              name="password"
              label={t('auth.login.password')}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={setPassword}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t bg-muted/50 p-4">
            <Button variant="ghost" type="button" onClick={toggleLanguage}>
              {t('common.switchTo')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
