import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/auth/use-auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/hooks/use-language'

interface LoginLocationState {
  from?: string
}

export function LoginPage() {
  const { t, toggleLanguage } = useLanguage()
  const { login } = useAuth()
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.login.title')}</CardTitle>
          <CardDescription>{t('auth.login.description')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('auth.login.username')}</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.login.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="mt-6 justify-end gap-2">
            <Button variant="ghost" type="button" onClick={toggleLanguage}>
              {t('common.switchTo')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? t('auth.login.submitting')
                : t('auth.login.submit')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
