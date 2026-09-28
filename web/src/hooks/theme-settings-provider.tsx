import { useTheme } from 'next-themes'
import { useEffect, useState, type ReactNode } from 'react'

import {
  ThemeSettingsContext,
  type ColorMode,
  type ThemeSettings,
} from '@/hooks/use-theme-settings'

/**
 * 主题设置的唯一持有者（`useThemeSettings()` 从这里取状态）。
 *
 * 放在 `main.tsx` 的 `<ThemeProvider>`（next-themes）**里面**：要用 `useTheme` 切 `.dark`。
 */
export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme()
  const [mode, setMode] = useState<ColorMode>('light')
  const [themeColor, setThemeColor] = useState('default')

  useEffect(() => {
    setTheme(mode === 'light' ? 'light' : 'dark')
  }, [mode, setTheme])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = themeColor
    root.dataset.darkShade = mode
  }, [themeColor, mode])

  const value: ThemeSettings = {
    mode,
    setMode,
    themeColor,
    setThemeColor,
  }

  return <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>
}
