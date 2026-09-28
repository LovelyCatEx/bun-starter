import { cn } from '@/lib/utils'

/**
 * 调试页左侧的分类导航。
 *
 * 纯展示件：只收 `items`（`{ id, label }`）和当前选中值，自己不持有状态、
 * 也不知道有哪些 section。**那份名单只在 `theme.tsx` 里写一遍**（id → 组件的映射
 * 和这里渲染的是同一个数组），所以不可能出现"导航里有、页面里没有"的漂移。
 *
 * 选中态用**左侧一根竖条**，不用底色：这一页存在的意义就是看组件**自己**的样子，
 * 导航块再铺一块底色，就把"组件落在页面底色上是什么观感"这件事搅浑了。
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
