import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * 调试页的一节。
 *
 * **故意不给自己底色**：它只有一圈边框，好让里面的组件直接坐在页面的底色上。
 * 这一页存在的意义就是看组件**自己**长什么样，外面再套一层卡片底会把观感带偏
 * （两层半透明叠起来不是组件本来的样子），而且"组件自己透不透"也就看不出来了。
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
 * 一个组件的展示位：一行小标题 + 一块放组件的地方。
 *
 * 默认是"横排、可换行"的排布，适合按钮 / 徽章 / 输入框这类小件。
 * 传了 `height` 就换成**定高块**，给那些自己有布局、撑开会把整页拉爆的组件
 * （chat-app / animated-sidebar / availability-scheduler / wallet-card 这些）。
 *
 * 定高块上加 `isolate`（`isolation: isolate`）是有意的：那些组件的内部会用
 * `absolute` + 负 `z-index` 做分层，`isolate` 把它们关在这块区域里，
 * 不然会跑到页面更下面的层去、被别的东西盖住。
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
            ? 'relative isolate w-full overflow-hidden rounded-lg border border-dashed'
            : 'flex flex-wrap items-center gap-3',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
