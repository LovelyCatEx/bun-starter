import { AUTH_MODE } from '@/auth/auth-mode'
import { useAuth } from '@/auth/use-auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useLanguage } from '@/hooks/use-language'

import { APP_NAME, APP_VERSION } from '../../../app.config'

export function HomePage() {
  const { t, toggleLanguage } = useLanguage()
  const { user, logout } = useAuth()

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            {t('home.title')}
            <Badge variant="secondary">{user?.username}</Badge>
          </CardTitle>
          <CardDescription>{t('home.description')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>{t('home.signedInAs', { name: user?.name ?? '' })}</p>
          <p>{t('home.authMode', { mode: AUTH_MODE })}</p>
          <p>{t('home.version', { name: APP_NAME, version: APP_VERSION })}</p>
        </CardContent>

        <CardFooter className="justify-between gap-2">
          <Button variant="ghost" onClick={toggleLanguage}>
            {t('common.switchTo')}
          </Button>
          <Button variant="ghost" onClick={() => void logout()}>
            {t('common.signOut')}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
