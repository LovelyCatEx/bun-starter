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
  /** 背景图遮罩开关：在背景图上压一层白/黑，让内容更清晰 */
  overlay: boolean
  setOverlay: (overlay: boolean) => void
  /** 背景图遮罩透明度 0~1（滑块上的值；实际生效值见 provider） */
  overlayOpacity: number
  setOverlayOpacity: (overlayOpacity: number) => void
  /** 高斯模糊开关：给按钮之类的控件加 backdrop-filter */
  frosted: boolean
  setFrosted: (frosted: boolean) => void
  /** 模糊半径，单位 px */
  frostedBlur: number
  setFrostedBlur: (frostedBlur: number) => void
}

export const ThemeSettingsContext = createContext<ThemeSettings | null>(null)

/**
 * 统一的主题控制。状态在 `<ThemeSettingsProvider>` 里，任何组件拿到的都是同一份；日夜交给
 * next-themes（`.dark` 类），其余维度与两个 CSS 变量写在 `<html>` 上 —— 浮层 portal 到 `body`，
 * 挂在 `<html>` 才继承得到。组件侧的 `bgimage:` 与毛玻璃见 frontend.md。
 */
export function useThemeSettings(): ThemeSettings {
  const settings = useContext(ThemeSettingsContext)
  if (!settings) {
    throw new Error('useThemeSettings must be used in <ThemeSettingsProvider>')
  }
  return settings
}
