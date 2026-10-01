import { useState } from 'react'

import { Button } from '@/components/motion/button'
import { useNotification } from '@/hooks/notification/use-notification'
import { Section } from '@/pages/debug/components/section'

/**
 * Demo for `web/src/hooks/notification/`: permission (a gesture is required), tag
 * collapsing, the foreground policy and a click handler, all through `useNotification()`.
 *
 * English and hard-coded on purpose; the debug page is exempt from i18n (see frontend.md).
 */
export function NotificationSection() {
  const { supported, permission, requestPermission, notify, close } = useNotification()
  const [clicked, setClicked] = useState(false)
  const [policyResult, setPolicyResult] = useState<boolean | null>(null)

  const status = supported ? permission : 'unsupported'
  const body = `A local notification, sent at ${new Date().toLocaleTimeString()}`

  const PERMISSION_LABEL = {
    default: 'never asked',
    granted: 'granted',
    denied: 'denied — only the browser settings can undo this',
    unsupported: 'unavailable in this context',
  }

  return (
    <Section
      title="Notification"
      description="Local browser notifications: permission, tag collapsing, foreground policy, click handling. Nothing here goes through the server."
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-sm text-muted-foreground">Permission</span>
        <span className="text-sm font-medium">{PERMISSION_LABEL[status]}</span>
        <Button
          size="sm"
          onClick={() => void requestPermission()}
          disabled={!supported || permission === 'granted'}
        >
          Request permission
        </Button>
      </div>

      {supported ? null : (
        <p className="text-xs text-muted-foreground">
          Needs a secure context (https or localhost). A packaged build opened over plain http
          on a LAN address can never show a notification.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            notify({ title: 'bun-starter', body, tag: 'debug.once', whenFocused: true })
          }}
        >
          Send one (also while focused)
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // 同 tag 互相替换，三条只剩一条
            for (const index of [1, 2, 3]) {
              notify({
                title: 'bun-starter',
                body: `#${index} ${body}`,
                tag: 'debug.burst',
                whenFocused: true,
              })
            }
          }}
        >
          Three with one tag
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // 不传 whenFocused：页面在前台时会被策略挡下，这里把返回值显示出来
            const shown = notify({ title: 'bun-starter', body, tag: 'debug.policy' })

            setPolicyResult(shown)
          }}
        >
          Default policy (reports the result)
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setClicked(false)
            notify({
              title: 'bun-starter',
              body,
              tag: 'debug.click',
              whenFocused: true,
              onClick: () => setClicked(true),
            })
          }}
        >
          Send one with a click handler
        </Button>

        <Button size="sm" variant="ghost" onClick={() => close()}>
          Close all of ours
        </Button>
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {policyResult === null ? null : <p>notify() returned {String(policyResult)}</p>}
        {clicked ? <p className="text-foreground">The notification was clicked.</p> : null}
      </div>
    </Section>
  )
}
