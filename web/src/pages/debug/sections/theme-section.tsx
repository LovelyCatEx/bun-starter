import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useThemeSettings, type ColorMode } from '@/hooks/use-theme-settings'
import { Section } from '@/pages/debug/sections/section'

const MODES: { value: ColorMode; label: string }[] = [
  { value: 'light', label: '亮色' },
  { value: 'deep-black', label: '深黑' },
  { value: 'dark-gray', label: '深灰' },
  { value: 'light-gray', label: '浅灰' },
]

const THEME_COLORS = [
  { value: 'default', label: '默认主题' },
  { value: 'sakura-pink', label: 'sakura-pink' },
]

export function ThemeSection() {
  const {
    mode,
    setMode,
    themeColor,
    setThemeColor,
    background,
    setBackground,
    frosted,
    setFrosted,
    overlay,
    setOverlay,
    overlayOpacity,
    setOverlayOpacity,
  } = useThemeSettings()

  return (
    <Section
      title="Theme"
      description="日夜与暗色档位、主题色、背景图、毛玻璃，以及背景图上的那层遮罩。开关直接生效。"
    >
      <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="theme-mode" className="text-sm">
            Mode
          </Label>
          <Select value={mode} onValueChange={(value) => setMode(value as ColorMode)}>
            <SelectTrigger id="theme-mode" className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="theme-color" className="text-sm">
            Color
          </Label>
          <Select value={themeColor} onValueChange={setThemeColor}>
            <SelectTrigger id="theme-color" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_COLORS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="theme-background" checked={background} onCheckedChange={setBackground} />
          <Label htmlFor="theme-background" className="text-sm">
            Background
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="theme-frosted" checked={frosted} onCheckedChange={setFrosted} />
          <Label htmlFor="theme-frosted" className="text-sm">
            Frosted
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="theme-overlay"
            checked={overlay}
            onCheckedChange={setOverlay}
            disabled={!background}
          />
          <Label htmlFor="theme-overlay" className="text-sm">
            Overlay
            <span className="text-xs font-normal text-muted-foreground">（遮罩）</span>
          </Label>
        </div>
      </div>

      <div className="flex max-w-md flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Overlay opacity</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.round(overlayOpacity * 100)}% · {mode === 'light' ? '白' : '黑'}
          </span>
        </div>
        <Slider
          aria-label="Overlay opacity"
          value={[Math.round(overlayOpacity * 100)]}
          onValueChange={([value]) => setOverlayOpacity(value / 100)}
          min={0}
          max={100}
          step={5}
          disabled={!background || !overlay}
        />
        <p className="text-xs text-muted-foreground">
          遮罩是背景图那一层的，先开 Background 再开 Overlay 才能调；亮色压白、暗色压黑。
          遮罩越厚，边框跟着越灰（--border / --input 都走这条）。
        </p>
      </div>
    </Section>
  )
}
