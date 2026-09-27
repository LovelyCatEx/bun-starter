import { useTheme } from 'next-themes'
import { useEffect, useState, type ReactNode } from 'react'

import {
  ThemeSettingsContext,
  type ColorMode,
  type ThemeSettings,
} from '@/hooks/use-theme-settings'

/** 遮罩默认透明度：开着就有明显效果，但不至于把背景图糊死 */
const DEFAULT_OVERLAY_OPACITY = 0.5

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
  const [frosted, setFrosted] = useState(false)
  const [overlay, setOverlay] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(DEFAULT_OVERLAY_OPACITY)

  useEffect(() => {
    setTheme(mode === 'light' ? 'light' : 'dark')
  }, [mode, setTheme])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = themeColor
    root.dataset.darkShade = mode
    root.dataset.background = String(background)
    root.dataset.frosted = String(frosted)
    root.dataset.backgroundOverlay = String(overlay)
    // 遮罩**实际**生效的透明度：开关关掉时就是 0。除了遮罩层自己，
    // 背景图模式下的边框 token（base.css）也按它来加深，所以这里必须是"生效值"而不是滑块值。
    root.style.setProperty(
      '--background-overlay-opacity',
      String(overlay ? overlayOpacity : 0),
    )
  }, [themeColor, mode, background, frosted, overlay, overlayOpacity])

  const value: ThemeSettings = {
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
  }

  return <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>
}
