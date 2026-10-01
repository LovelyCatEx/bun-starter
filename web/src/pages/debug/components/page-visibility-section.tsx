import { usePageVisibility } from '@/hooks/use-page-visibility'
import { Section } from '@/pages/debug/components/section'

/**
 * English and hard-coded on purpose — the debug page is exempt from the i18n rules
 * (see `.claude/rules/frontend.md`).
 */
export function PageVisibilitySection() {
  const { visible, focused, active } = usePageVisibility()

  return (
    <Section
      title="Page visibility"
      description="usePageVisibility() — whether this page is visible, focused, and in front of the user."
    >
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <span>
          <span className="text-muted-foreground">visible </span>
          <span className="font-medium">{String(visible)}</span>
        </span>
        <span>
          <span className="text-muted-foreground">focused </span>
          <span className="font-medium">{String(focused)}</span>
        </span>
        <span>
          <span className="text-muted-foreground">active </span>
          <span className="font-medium">{String(active)}</span>
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Click another window (without switching tabs): focused goes false, visible stays true,
        active goes false. Use `active` — the notification module asks the same question before
        popping a system notification.
      </p>
    </Section>
  )
}
