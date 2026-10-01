import { RangeSlider } from '@/components/motion/range-slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/motion/select'
import { ShaderBackground } from '@/components/motion/shader-background'
import { SharedLayoutBg } from '@/components/motion/shared-layout-bg'
import { Switch } from '@/components/motion/switch'
import { ThemeToggle } from '@/components/motion/theme-toggle'
import { useThemeSettings, type ColorMode } from '@/hooks/use-theme-settings'
import { Demo, Section } from '@/pages/debug/components/section'

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

const TOGGLE_VARIANTS = ['rectangle', 'circle', 'circle-blur', 'blinds'] as const

const SHADERS = ['mesh-gradient', 'dot-grid', 'waves', 'voronoi'] as const

/** beUI 的 Select 不收 `id`，所以表单控件这一层只能配一个可见的文字标题，没法 `htmlFor`。 */
function FieldLabel({ children }: { children: string }) {
  return <span className="text-sm text-muted-foreground">{children}</span>
}

/**
 * 常驻在调试页最上面的一节，翻分类也翻不走。五个开关写的是 `<html>` 上的 data 属性与
 * CSS 变量；「透 / 糊」两半的规则见 `frosted.css` 顶部，新组件走 `data-slot`。
 */
export function ThemeSection() {
  const {
    mode,
    setMode,
    themeColor,
    setThemeColor,
    background,
    setBackground,
    overlay,
    setOverlay,
    overlayOpacity,
    setOverlayOpacity,
    frosted,
    setFrosted,
    frostedBlur,
    setFrostedBlur,
  } = useThemeSettings()

  return (
    <Section
      title="Theme"
      description="颜色模式（四档）、主题色、背景图与遮罩、高斯模糊。所有开关都直接改 <html> 上的 data 属性／CSS 变量——颜色与主题色全站组件立刻跟着变；背景图只画在调试页这一层（组件要透出它得自己写 bgimage:）；模糊命中 beUI 的按钮。"
    >
      <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <div className="flex items-center gap-2">
          <FieldLabel>Mode</FieldLabel>
          <Select value={mode} onValueChange={(value) => setMode(value as ColorMode)}>
            <SelectTrigger className="w-[130px]">
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
          <FieldLabel>Color</FieldLabel>
          <Select value={themeColor} onValueChange={setThemeColor}>
            <SelectTrigger className="w-[150px]">
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

        {/* beUI 的 Switch 自带 label，但这两行的措辞要跟下面的说明对齐，所以自己写 */}
        <div className="flex items-center gap-2">
          <FieldLabel>Background</FieldLabel>
          <Switch
            checked={background}
            onCheckedChange={setBackground}
            ariaLabel="Background image"
          />
        </div>

        <div className="flex items-center gap-2">
          <FieldLabel>Overlay</FieldLabel>
          <Switch
            checked={overlay}
            onCheckedChange={setOverlay}
            disabled={!background}
            ariaLabel="Background overlay"
          />
        </div>

        {/* 遮罩是背景图那一层的东西，所以两个开关都得开才可调 */}
        <div className="flex w-full max-w-md flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <FieldLabel>Overlay opacity</FieldLabel>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {Math.round(overlayOpacity * 100)}% · {mode === 'light' ? '白' : '黑'}
            </span>
          </div>
          <RangeSlider
            aria-label="Overlay opacity"
            showTicks={false}
            value={Math.round(overlayOpacity * 100)}
            onValueChange={(value) => setOverlayOpacity(value / 100)}
            min={0}
            max={100}
            step={5}
            disabled={!background || !overlay}
            formatValueText={(value) => `${value}%`}
          />
          <p className="text-xs text-muted-foreground">
            「白 / 黑」是遮罩的压色方向：亮色压白、另外三档压黑。遮罩越厚，背景图模式下的边框
            跟着越深（`--border` 与 `--border-strong` 都走这条）。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FieldLabel>Blur</FieldLabel>
          <Switch
            checked={frosted}
            onCheckedChange={setFrosted}
            ariaLabel="Frosted blur"
          />
        </div>

        {/* 模糊跟背景图是两件独立的事：只开 Blur 时按钮会半透明，但背后是纯色、没有可糊的东西 */}
        <div className="flex w-full max-w-md flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <FieldLabel>Blur radius</FieldLabel>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {frostedBlur}px
            </span>
          </div>
          <RangeSlider
            aria-label="Blur radius"
            showTicks={false}
            value={frostedBlur}
            onValueChange={setFrostedBlur}
            min={0}
            max={32}
            step={4}
            disabled={!frosted}
            formatValueText={(value) => `${value}px`}
          />
          <p className="text-xs text-muted-foreground">
            作用于<em>导出名以 Button 结尾的组件</em>（Stateful / Metallic / HoldAction / SlideAction /
            ActionSwap 系列 / ExpandingArrow / IconButton / CopyButton …）。它靠{' '}
            <code className="font-mono text-xs">[data-slot=&apos;button&apos;]</code> 命中、覆盖的是底色{' '}
            <em>token</em> 而不是 <code className="font-mono text-xs">background-color</code>，
            所以 hover / 暗色 / 主题色全都自动跟着走。本来透明的按钮（ghost / icon / copy）
            只有在 hover 时才看得出糊。
          </p>
        </div>
      </div>

      {/*
        `bgimage:` 的全仓库唯一调用点 —— 删了它，这个变体在产物里就不存在（Tailwind v4 对
        没有消费者的 utility 不生成 CSS）。两层底色是有意的，见 `frontend.md`「背景图」。
      */}
      <Demo label="bgimage: (唯一调用点)">
        <div className="w-full rounded-xl border bg-card p-4 bgimage:bg-card/60">
          <p className="text-sm text-card-foreground">
            这个块写的是 <code className="font-mono text-xs">bg-card bgimage:bg-card/60</code>
            。把上面的 Background 打开，它变半透明、背后的图案透出来；关掉就回实心。
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            组件想透出背景图，就是给它挂这么一个类 —— 不用改生成物，重装 beUI 也冲不掉。
          </p>
        </div>
      </Demo>

      {/* ── beUI 自带的三件"外壳" ───────────────────────────────── */}

      <Demo label="theme-toggle">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {TOGGLE_VARIANTS.map((variant) => (
              <ThemeToggle
                key={variant}
                variant={variant}
                className="size-10 rounded-full border border-border"
              />
            ))}
          </div>
          {/*
            它内部直接调 next-themes 的 setTheme('light' | 'dark')，和本仓库的四档 `mode`
            不是同一套 —— 点下去会「页面变了、上面的 Mode 下拉没变」。
          */}
          <p className="max-w-lg text-xs text-muted-foreground">
            四种入场：rectangle / circle / circle-blur / blinds。注意它走的是 next-themes 的两档
            日夜，和本页的四档 Mode 不同源，点了会「页面变了、下拉没变」。
          </p>
        </div>
      </Demo>

      <Demo label="shared-layout-bg">
        <SharedLayoutBg className="w-56 rounded-2xl border border-border p-1">
          {['Overview', 'Holdings', 'Activity', 'Settings'].map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-xl px-4 py-2 text-left text-sm text-foreground"
            >
              {item}
            </button>
          ))}
        </SharedLayoutBg>
      </Demo>

      <Demo label="shader-background">
        <div className="flex flex-wrap gap-3">
          {SHADERS.map((variant) => (
            <div
              key={variant}
              className="relative size-44 overflow-hidden rounded-xl border border-border"
            >
              <ShaderBackground variant={variant} className="absolute inset-0" />
              <span className="absolute inset-x-0 bottom-0 bg-background/60 px-2 py-1 text-xs text-foreground">
                {variant}
              </span>
            </div>
          ))}
        </div>
      </Demo>

      <p className="text-xs text-muted-foreground">
        shader-background 一共 21 个变体，这里只挑 4 个 —— 每个都是 WebGL canvas，
        全放上来会让这一节吃掉整页的 GPU。要换别的，把 SHADERS 里的名字改成
        `SHADER_BACKGROUND_VARIANTS` 里的任意一项即可。
      </p>
    </Section>
  )
}
