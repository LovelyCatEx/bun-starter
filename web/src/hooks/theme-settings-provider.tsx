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

/**
 * 主题设置的唯一持有者（`useThemeSettings()` 从这里取状态）。
 *
 * 放在 `main.tsx` 的 `<ThemeProvider>`（next-themes）**里面**：要用 `useTheme` 切 `.dark`。
 */
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
    // 遮罩**实际**生效的透明度：开关关掉时就是 0。除了遮罩层自己，
    // 背景图模式下的边框 token（base.css 的规则）也按它来加深，所以这里必须是"生效值"，
    // 而不是滑块上那个数 —— 否则关了遮罩边框还停在压深状态，跟遮罩厚度对不上。
    root.style.setProperty(
      '--background-overlay-opacity',
      String(overlay ? overlayOpacity : 0),
    )
    // 模糊半径只在开着时才写：`frosted.css` 那条规则的**存在**由 `data-frosted` 决定，
    // 所以关掉时留着一个旧半径是无害的（没有规则会读它），这里就不额外抹成 0 了。
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
