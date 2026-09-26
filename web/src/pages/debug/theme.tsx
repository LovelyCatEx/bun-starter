import { DirectionProvider } from '@/components/ui/direction'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useThemeSettings, type ColorMode } from '@/hooks/use-theme-settings'
import { AiSection } from '@/pages/debug/sections/ai-section'
import { BasicSection } from '@/pages/debug/sections/basic-section'
import { DataSection } from '@/pages/debug/sections/data-section'
import { FormSection } from '@/pages/debug/sections/form-section'
import { InputSection } from '@/pages/debug/sections/input-section'
import { LayoutSection } from '@/pages/debug/sections/layout-section'
import { NavigationSection } from '@/pages/debug/sections/navigation-section'
import { OverlaySection } from '@/pages/debug/sections/overlay-section'

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
  const {
    mode,
    setMode,
    themeColor,
    setThemeColor,
    background,
    setBackground,
    frosted,
    setFrosted,
  } = useThemeSettings()

  return (
    <DirectionProvider dir="ltr" direction="ltr">
      <TooltipProvider>
        <main
          className="min-h-svh bg-background text-foreground"
          style={
            background ? { backgroundImage: DEBUG_BACKGROUND } : undefined
          }
        >
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
              <div className="flex items-center gap-4">
                <Select
                  value={mode}
                  onValueChange={(value) => setMode(value as ColorMode)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">亮色</SelectItem>
                    <SelectItem value="deep-black">深黑</SelectItem>
                    <SelectItem value="dark-gray">深灰</SelectItem>
                    <SelectItem value="light-gray">浅灰</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={themeColor} onValueChange={setThemeColor}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">默认主题</SelectItem>
                    <SelectItem value="sakura-pink">sakura-pink</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch
                    id="debug-background"
                    checked={background}
                    onCheckedChange={setBackground}
                  />
                  <Label htmlFor="debug-background" className="text-sm">
                    Background
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="debug-frosted"
                    checked={frosted}
                    onCheckedChange={setFrosted}
                  />
                  <Label htmlFor="debug-frosted" className="text-sm">
                    Frosted
                  </Label>
                </div>
              </div>
            </div>
          </header>
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
            <BasicSection />
            <FormSection />
            <InputSection />
            <LayoutSection />
            <NavigationSection />
            <DataSection />
            <OverlaySection />
            <AiSection />
          </div>
        </main>
      </TooltipProvider>
    </DirectionProvider>
  )
}
