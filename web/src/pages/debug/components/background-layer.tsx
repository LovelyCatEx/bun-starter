import { useThemeSettings } from '@/hooks/use-theme-settings'

/*
 * 调试页的"背景图"不是一个图片文件，是**内联 SVG data URI + 几个渐变** —— 这样它跟着代码走，
 * 没有第二份素材要维护。所有色标都带 alpha（`rgba(127,127,127,…)` 的中性灰），叠在
 * `bg-background` 之上，所以**一份就同时成立在亮色与四档暗色下**，不需要为暗色再画一张。
 *
 * 图案是 64×64 的平铺贴片：网格线 + 一个圆环 + 两个圆点 + 一个十字 + 一个四角星。
 * 上面再叠三层 radial-gradient（紫 / 蓝 / 绿）和一层 linear-gradient（粉 → 天蓝），
 * 给底色一点色相，免得只有灰花纹。
 */
const DEBUG_PATTERN = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>",
  "<path d='M64 0H0V64' fill='none' stroke='rgba(127,127,127,0.15)'/>",
  "<circle cx='16' cy='16' r='6' fill='none' stroke='rgba(127,127,127,0.25)'/>",
  "<circle cx='48' cy='20' r='1.6' fill='rgba(127,127,127,0.45)'/>",
  "<circle cx='12' cy='50' r='1.2' fill='rgba(127,127,127,0.35)'/>",
  "<path d='M40 44h8M44 40v8' stroke='rgba(127,127,127,0.4)' stroke-width='1.5' stroke-linecap='round'/>",
  "<path d='M32 6l1.6 4.4L38 12l-4.4 1.6L32 18l-1.6-4.4L26 12l4.4-1.6z' fill='rgba(127,127,127,0.28)'/>",
  '</svg>',
].join('')

const DEBUG_BACKGROUND = [
  `url("data:image/svg+xml,${encodeURIComponent(DEBUG_PATTERN)}")`,
  'radial-gradient(at 15% 15%, rgba(168, 85, 247, 0.38), transparent 60%)',
  'radial-gradient(at 85% 20%, rgba(59, 130, 246, 0.38), transparent 60%)',
  'radial-gradient(at 50% 95%, rgba(16, 185, 129, 0.38), transparent 60%)',
  'linear-gradient(135deg, rgba(236, 72, 153, 0.18), rgba(56, 189, 248, 0.18))',
].join(', ')

/**
 * 背景图与遮罩两层，渲染在页面内容之下。**只有调试页用**（状态在 `<html>` 上全站可见，
 * 但画这两层的只有这一页 —— 首页和登录页保持干净的底色）。
 *
 * 层级是固定的两层而不是"图写在 `<main>` 的 inline style 上"：
 *
 * ```
 * -z-20  背景图
 * -z-10  遮罩（亮色压白、暗色压黑，"白/黑"由 `dark:bg-black` 决定）
 *   0    <main> 自己的 bg-background，以及全部内容
 * ```
 *
 * 这么排之后 `<main>` 的底色仍然在最底下，不用给它加 inline style，层级一眼可读。
 *
 * ⚠️ **这两层靠 `<main>` 上的 `isolate` 关在页面里**。没有 `isolation: isolate` 的话
 * 负 `z-index` 会退到页面背景之后、看起来像"没生效"——那是这一整套最容易踩的一脚。
 */
export function BackgroundLayer() {
  const { background, overlay } = useThemeSettings()

  return (
    <>
      {background ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20"
          style={{ backgroundImage: DEBUG_BACKGROUND }}
        />
      ) : null}
      {background && overlay ? (
        <div
          data-slot="background-overlay"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-white opacity-(--background-overlay-opacity) dark:bg-black"
        />
      ) : null}
    </>
  )
}
