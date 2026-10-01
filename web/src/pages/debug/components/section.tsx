import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * 调试页的一节。**故意不给自己底色**：这一页就是要看组件自己长什么样，套一层卡片底
 * 会把观感带偏，也看不出组件自己透不透。
 */
export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border p-6 text-card-foreground">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </section>
  )
}

/**
 * 一个组件的展示位；传了 `height` 就换成定高块（自己有布局、撑开会把整页拉爆的大件才需要）。
 * 定高块用 `relative z-0` 而非 `isolate`：两者都造 stacking context，但后者同时是
 * backdrop root，会把后代的高斯模糊关死。见 frontend.md「物理铁律」。
 */
export function Demo({
  label,
  children,
  className,
  height,
}: {
  label: string
  children: ReactNode
  className?: string
  /** 传了就变成定高容器（数字按 px 算）；大件组件才需要 */
  height?: CSSProperties['height']
}) {
  const framed = height !== undefined

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div
        style={framed ? { height } : undefined}
        className={cn(
          framed
            ? 'relative z-0 w-full overflow-hidden rounded-lg border border-dashed'
            : 'flex flex-wrap items-center gap-3',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
