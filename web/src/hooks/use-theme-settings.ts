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
 * 统一的主题控制：日夜 + 暗色程度 + 主题色 + 背景图 + 遮罩 + 高斯模糊。
 *
 * 状态在 `<ThemeSettingsProvider>`（`src/hooks/theme-settings-provider.tsx`）里，任何组件
 * 调这个 hook 拿到的都是同一份 —— 所以页面和页面里的 section 可以各调各的，不会各存一份。
 *
 * - `light` / `dark` 交给 next-themes（决定 `<html>` 上的 `.dark` 类，从而驱动所有 `dark:` 变体）
 * - 其余维度写到 `<html>` 的 data 属性上：`data-theme`(主题色) / `data-dark-shade`(灰度) /
 *   `data-background`(背景图) / `data-frosted`(高斯模糊)，外加两个 CSS 变量
 *   `--background-overlay-opacity`（遮罩透明度）与 `--frosted-blur`（模糊半径），
 *   两者都是**实际生效值**（开关关掉时分别是 0 / 不生效）。
 *   写在 `<html>` 而不是页面容器，是因为 beUI 的浮层（popover / menu / tooltip / toast）会
 *   portal 到 `body`，挂在这里它们才继承得到
 *
 * **组件侧只有一个可选的自定义变体：`bgimage:`**（`base.css`）。它是个**工具**、不是自动机制 ——
 * **没有任何 beUI 组件默认使用它**，所以开背景图时组件仍然是自己的实心底色。要让某个元素透出
 * 背景图，就在它的 className 上写 `bgimage:bg-card/60`（挑两种模式都不透明的 token）。
 * 这么设计是因为生成物会被 `shadcn add --overwrite` 冲掉，机制必须能活在生成物之外。
 *
 * **高斯模糊走的是另一条路**：`frosted.css` 按组件上的 `data-slot` 命中，覆盖的是底色 token
 * （不是 `background-color`），所以 hover / 暗色 / 主题色全自动跟着走。
 * 哪些组件打了标记、各自覆盖哪些 token，见 `frontend.md` 的「高斯模糊」。
 */
export function useThemeSettings(): ThemeSettings {
  const settings = useContext(ThemeSettingsContext)
  if (!settings) {
    throw new Error('useThemeSettings must be used in <ThemeSettingsProvider>')
  }
  return settings
}
