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
}

export const ThemeSettingsContext = createContext<ThemeSettings | null>(null)

/**
 * 统一的主题控制：日夜 + 暗色程度 + 主题色。
 *
 * 状态在 `<ThemeSettingsProvider>`（`src/hooks/theme-settings-provider.tsx`）里，任何组件
 * 调这个 hook 拿到的都是同一份 —— 所以页面和页面里的 section 可以各调各的，不会各存一份。
 *
 * - `light` / `dark` 交给 next-themes（决定 `<html>` 上的 `.dark` 类，从而驱动所有 `dark:` 变体）
 * - 其余维度写到 `<html>` 的 data 属性上：`data-theme`(主题色) / `data-dark-shade`(灰度)
 *   写在 `<html>` 而不是页面容器，是因为 beUI 的浮层（popover / menu / tooltip / toast）会
 *   portal 到 `body`，挂在这里它们才继承得到
 *
 * **组件侧不再有对应的自定义变体。** 以前还有 `frosted:`（毛玻璃）和 `bgimage:`（背景图）
 * 两个 Tailwind 变体，随背景图功能一起删掉了 —— 组件现在就是 beUI 原生样式，不再跟着
 * 页面开关改变外观。
 */
export function useThemeSettings(): ThemeSettings {
  const settings = useContext(ThemeSettingsContext)
  if (!settings) {
    throw new Error('useThemeSettings must be used in <ThemeSettingsProvider>')
  }
  return settings
}
