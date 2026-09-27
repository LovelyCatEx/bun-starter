import { DirectionProvider } from '@/components/ui/direction'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useThemeSettings } from '@/hooks/use-theme-settings'
import { AiSection } from '@/pages/debug/components/ai-section'
import { BasicSection } from '@/pages/debug/components/basic-section'
import { DataSection } from '@/pages/debug/components/data-section'
import { FormSection } from '@/pages/debug/components/form-section'
import { InputSection } from '@/pages/debug/components/input-section'
import { LayoutSection } from '@/pages/debug/components/layout-section'
import { NavigationSection } from '@/pages/debug/components/navigation-section'
import { NotificationSection } from '@/pages/debug/components/notification-section'
import { PageVisibilitySection } from '@/pages/debug/components/page-visibility-section'
import { OverlaySection } from '@/pages/debug/components/overlay-section'
import { ThemeSection } from '@/pages/debug/components/theme-section'

// A hand-drawn background "image": a tiling SVG texture (graph grid + dots,
// rings, a plus and a sparkle) layered over colour blobs. Everything is
// semi-transparent so it blends over the theme's `bg-background`, which keeps it
// readable in light and dark.
const DEBUG_PATTERN = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>",
  "<path d='M64 0H0V64' fill='none' stroke='rgba(127,127,127,0.15)'/>",
  "<circle cx='16' cy='16' r='6' fill='none' stroke='rgba(127,127,127,0.25)'/>",
  "<circle cx='48' cy='20' r='1.6' fill='rgba(127,127,127,0.45)'/>",
  "<circle cx='12' cy='50' r='1.2' fill='rgba(127,127,127,0.35)'/>",
  "<path d='M40 44h8M44 40v8' stroke='rgba(127,127,127,0.4)' stroke-width='1.5' stroke-linecap='round'/>",
  "<path d='M32 6l1.6 4.4L38 12l-4.4 1.6L32 18l-1.6-4.4L26 12l4.4-1.6z' fill='rgba(127,127,127,0.28)'/>",
  '</svg>',
].join('')

const DEBUG_BACKGROUND = [
  `url("data:image/svg+xml,${encodeURIComponent(DEBUG_PATTERN)}")`,
  'radial-gradient(at 15% 15%, rgba(168, 85, 247, 0.38), transparent 60%)',
  'radial-gradient(at 85% 20%, rgba(59, 130, 246, 0.38), transparent 60%)',
  'radial-gradient(at 50% 95%, rgba(16, 185, 129, 0.38), transparent 60%)',
  'linear-gradient(135deg, rgba(236, 72, 153, 0.18), rgba(56, 189, 248, 0.18))',
].join(', ')

export function ThemeDebugPage() {
  const { background, overlay } = useThemeSettings()

  return (
    <DirectionProvider dir="ltr" direction="ltr">
      <TooltipProvider>
        {/* `isolate` + `-z-10` 的遮罩层：压在背景图之上、所有内容之下 */}
        <main
          className="relative isolate min-h-svh bg-background text-foreground"
          style={background ? { backgroundImage: DEBUG_BACKGROUND } : undefined}
        >
          {background && overlay ? (
            <div
              data-slot="background-overlay"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-white opacity-(--background-overlay-opacity) dark:bg-black"
            />
          ) : null}
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
              <div>
                <h1 className="font-heading text-lg font-semibold">
                  Theme Debug
                </h1>
                <p className="text-xs text-muted-foreground">
                  Every component in web/src/components/ui, rendered against the
                  shadcn tokens.
                </p>
              </div>
            </div>
          </header>
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
            <ThemeSection />
            <BasicSection />
            <FormSection />
            <InputSection />
            <LayoutSection />
            <NavigationSection />
            <DataSection />
            <OverlaySection />
            <NotificationSection />
            <PageVisibilitySection />
            <AiSection />
          </div>
        </main>
      </TooltipProvider>
    </DirectionProvider>
  )
}
