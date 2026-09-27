import { createContext, useContext } from 'react'

/** 亮色 / 深黑 / 深灰 / 浅灰 */
export type ColorMode = 'light' | 'deep-black' | 'dark-gray' | 'light-gray'

export interface ThemeSettings {
  /** 颜色模式：亮色 / 深黑 / 深灰 / 浅灰 */
  mode: ColorMode
  setMode: (mode: ColorMode) => void
  /** 主题色，对应 `src/styles/themes/<name>.css` 的文件名 */
  themeColor: string
  setThemeColor: (themeColor: string) => void
  /** 背景图开关 */
  background: boolean
  setBackground: (background: boolean) => void
  /** 高斯模糊 / 毛玻璃开关 */
  frosted: boolean
  setFrosted: (frosted: boolean) => void
  /** 背景图遮罩开关：在背景图上压一层白/黑，让内容更清晰。可选，不开就没有遮罩 */
  overlay: boolean
  setOverlay: (overlay: boolean) => void
  /** 背景图遮罩透明度 0~1，由用户调 */
  overlayOpacity: number
  setOverlayOpacity: (overlayOpacity: number) => void
}

export const ThemeSettingsContext = createContext<ThemeSettings | null>(null)

/**
 * 统一的主题控制：日夜 + 暗色程度 + 主题色 + 背景图 + 高斯模糊 + 背景遮罩。
 *
 * 状态在 `<ThemeSettingsProvider>`（`src/hooks/theme-settings-provider.tsx`）里，任何组件
 * 调这个 hook 拿到的都是同一份 —— 所以页面和页面里的 section 可以各调各的，不会各存一份。
 *
 * - `light` / `dark` 交给 next-themes（决定 `<html>` 上的 `.dark` 类，从而驱动所有 `dark:` 变体）
 * - 其余维度写到 `<html>` 的 data 属性上：
 *   `data-theme`(主题色) / `data-dark-shade`(灰度) / `data-background` / `data-frosted` / `data-background-overlay`，
 *   外加 `--background-overlay-opacity`（遮罩透明度，给页面上的遮罩层读）
 *   写在 `<html>` 而不是页面容器，是因为 Radix 会把 Dialog/Select/Toast 等 Portal 到 `body`，
 *   这样它们也能继承。
 *
 * 组件样式侧对应这几个 Tailwind 自定义变体：`frosted:`（base.css）和 `bgimage:`（base.css）。
 */
export function useThemeSettings(): ThemeSettings {
  const settings = useContext(ThemeSettingsContext)
  if (!settings) {
    throw new Error('useThemeSettings 必须在 <ThemeSettingsProvider> 里使用')
  }
  return settings
}
