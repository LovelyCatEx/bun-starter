import { useThemeSettings } from '@/hooks/use-theme-settings'

/*
 * 调试页的"背景图"不是图片文件，是内联 SVG data URI + 渐变。色标全带 alpha、叠在
 * `bg-background` 上，所以一份就同时成立在亮色与四档暗色下 —— 没有第二份素材要维护。
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
 * 背景图与遮罩两层，只有调试页用。层级固定为 -z-20 图案 / -z-10 遮罩 / 0 内容，
 * 靠 `<main>` 上的 `isolate` 关在页面里（否则负 `z-index` 会退到页面背景之后）——
 * 见 frontend.md「背景图」。
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
