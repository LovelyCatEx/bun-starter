import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

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
}

/**
 * 统一的主题控制：日夜 + 暗色程度 + 主题色 + 背景图 + 高斯模糊。
 *
 * - `light` / `dark` 交给 next-themes（决定 `<html>` 上的 `.dark` 类，从而驱动所有 `dark:` 变体）
 * - 其余维度写到 `<html>` 的 data 属性上：
 *   `data-theme`(主题色) / `data-dark-shade`(灰度) / `data-background` / `data-frosted`
 *   写在 `<html>` 而不是页面容器，是因为 Radix 会把 Dialog/Select/Toast 等 Portal 到 `body`，
 *   这样它们也能继承。
 *
 * 组件样式侧对应这几个 Tailwind 自定义变体：`frosted:`（base.css）和 `bgimage:`（base.css）。
 */
export function useThemeSettings(): ThemeSettings {
  const { setTheme } = useTheme()
  const [mode, setMode] = useState<ColorMode>('light')
  const [themeColor, setThemeColor] = useState('default')
  const [background, setBackground] = useState(false)
  const [frosted, setFrosted] = useState(false)

  useEffect(() => {
    setTheme(mode === 'light' ? 'light' : 'dark')
  }, [mode, setTheme])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = themeColor
    root.dataset.darkShade = mode
    root.dataset.background = String(background)
    root.dataset.frosted = String(frosted)
  }, [themeColor, mode, background, frosted])

  return {
    mode,
    setMode,
    themeColor,
    setThemeColor,
    background,
    setBackground,
    frosted,
    setFrosted,
  }
}
