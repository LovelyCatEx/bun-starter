import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/motion/select'
import { ShaderBackground } from '@/components/motion/shader-background'
import { SharedLayoutBg } from '@/components/motion/shared-layout-bg'
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
 * 常驻在调试页最上面的一节，翻分类也翻不走。
 *
 * 只有两个开关：**颜色模式**（四档，写 `data-dark-shade`）和**主题色**（`data-theme`，
 * 对应 `src/styles/themes/<name>.css`）。以前的「背景图 / 高斯模糊 / 遮罩」三个开关
 * 连同那套 `bgimage:` / `frosted:` 变体一起删掉了 —— 组件现在就是 beUI 原生样式，
 * 不再跟着页面开关变外观。
 */
export function ThemeSection() {
  const { mode, setMode, themeColor, setThemeColor } = useThemeSettings()

  return (
    <Section
      title="Theme"
      description="颜色模式（亮色 / 深黑 / 深灰 / 浅灰）与主题色。这两个开关直接改 <html> 上的 data 属性，全站组件立刻跟着变。"
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
      </div>

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
            ⚠️ 它内部直接调 next-themes 的 setTheme('light' | 'dark')，和本仓库的四档
            `mode`（light + data-dark-shade）不是同一套。点下去页面会变黑，但上面的 Mode
            下拉还停在原值 —— 不是坏了，是两套状态各说各话。重选一次 Mode 就能复位。
            真要接进本仓库，得把它内部的 useTheme 换成 useThemeSettings。
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
