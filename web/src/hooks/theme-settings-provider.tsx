import { useTheme } from 'next-themes'
import { useEffect, useState, type ReactNode } from 'react'

import {
  ThemeSettingsContext,
  type ColorMode,
  type ThemeSettings,
} from '@/hooks/use-theme-settings'

/** 遮罩默认透明度：开着就有明显效果，但不至于把背景图糊死 */
const DEFAULT_OVERLAY_OPACITY = 0.5

/** 默认模糊半径（px）：跟 Tailwind 的 `backdrop-blur-md` 同档，开了有感觉但不糊成一片 */
const DEFAULT_FROSTED_BLUR = 12

/** 主题状态的唯一持有者（`useThemeSettings()` 从这里取）；必须挂在 next-themes 的 `<ThemeProvider>` 内。 */
export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme()
  const [mode, setMode] = useState<ColorMode>('light')
  const [themeColor, setThemeColor] = useState('default')
  const [background, setBackground] = useState(false)
  const [overlay, setOverlay] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(DEFAULT_OVERLAY_OPACITY)
  const [frosted, setFrosted] = useState(false)
  const [frostedBlur, setFrostedBlur] = useState(DEFAULT_FROSTED_BLUR)

  useEffect(() => {
    setTheme(mode === 'light' ? 'light' : 'dark')
  }, [mode, setTheme])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = themeColor
    root.dataset.darkShade = mode
    root.dataset.background = String(background)
    // 遮罩**实际**生效的透明度（关掉即 0）：`base.css` 的边框加深也读它，写成滑块值会让
    // 边框在遮罩关掉后仍停在压深状态。
    root.style.setProperty(
      '--background-overlay-opacity',
      String(overlay ? overlayOpacity : 0),
    )
    // 半径无条件写入：规则的**存在**由 `data-frosted` 决定，关掉后没有规则会读旧值。
    root.dataset.frosted = String(frosted)
    root.style.setProperty('--frosted-blur', `${frostedBlur}px`)
  }, [themeColor, mode, background, overlay, overlayOpacity, frosted, frostedBlur])

  const value: ThemeSettings = {
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
  }

  return <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>
}
