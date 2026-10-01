import { cn } from '@/lib/utils'

/**
 * 调试页左侧的分类导航。纯展示件：只收 `items` 和当前选中值，不持有状态、也不知道
 * 有哪些 section —— 那份名单只在 `theme.tsx` 里写一遍。
 *
 * 选中态用左侧一根竖条而不是底色：这一页就是看组件落在页面底色上的样子。
 */
export function SectionNav<Id extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly { id: Id; label: string }[]
  value: Id
  onChange: (id: Id) => void
}) {
  return (
    <nav aria-label="Categories" className="flex flex-col gap-0.5">
      <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Categories
      </p>
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'true' : undefined}
            onClick={() => onChange(item.id)}
            className={cn(
              'border-l-2 py-1.5 pr-2 pl-3 text-left text-sm transition-colors',
              active
                ? 'border-foreground font-medium text-foreground'
                : 'border-border/60 text-muted-foreground hover:border-foreground/50 hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
