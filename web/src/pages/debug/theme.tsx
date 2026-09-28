import { useEffect, useState } from 'react'

import { AgentToolsSection } from '@/pages/debug/components/agent-tools-section'
import { AgentsSection } from '@/pages/debug/components/agents-section'
import { ButtonsSection } from '@/pages/debug/components/buttons-section'
import { ChartsSection } from '@/pages/debug/components/charts-section'
import { DataSection } from '@/pages/debug/components/data-section'
import { DomainSection } from '@/pages/debug/components/domain-section'
import { FilesSection } from '@/pages/debug/components/files-section'
import { FormSection } from '@/pages/debug/components/form-section'
import { MotionSection } from '@/pages/debug/components/motion-section'
import { NavigationSection } from '@/pages/debug/components/navigation-section'
import { NotificationSection } from '@/pages/debug/components/notification-section'
import { OverlaySection } from '@/pages/debug/components/overlay-section'
import { PageVisibilitySection } from '@/pages/debug/components/page-visibility-section'
import { SectionNav } from '@/pages/debug/components/section-nav'
import { TextSection } from '@/pages/debug/components/text-section'
import { ThemeSection } from '@/pages/debug/components/theme-section'

/**
 * 全页唯一的分类名单：id、导航上显示的名字、真正的组件，三样写在一起。
 *
 * **加一节就在这里加一行**，导航和内容会同时跟上 —— 不要另外维护一份导航用的数组，
 * 那种写法迟早漂移成"导航里点得到、页面里是空的"。
 *
 * 排的就是 beUI 自己的分类顺序（按钮 → 表单 → 浮层 → 导航 → 文字 → 动效 →
 * 数据 → 图表 → agent → 文件 → 领域），`Theme` 不在里面：那一节常驻在页面最上面，
 * 不参与翻页。
 */
const SECTIONS = [
  { id: 'buttons', label: 'Buttons & actions', Component: ButtonsSection },
  { id: 'form', label: 'Forms & inputs', Component: FormSection },
  { id: 'overlay', label: 'Overlays & feedback', Component: OverlaySection },
  { id: 'navigation', label: 'Navigation', Component: NavigationSection },
  { id: 'text', label: 'Text & numbers', Component: TextSection },
  { id: 'motion', label: 'Scroll & motion', Component: MotionSection },
  { id: 'data', label: 'Data & tables', Component: DataSection },
  { id: 'charts', label: 'Charts', Component: ChartsSection },
  { id: 'agents', label: 'Agent & chat', Component: AgentsSection },
  { id: 'agent-tools', label: 'Agent tools', Component: AgentToolsSection },
  { id: 'files', label: 'Files & upload', Component: FilesSection },
  { id: 'domain', label: 'Other & domain', Component: DomainSection },
  { id: 'notification', label: 'Notification', Component: NotificationSection },
  { id: 'page-visibility', label: 'Page visibility', Component: PageVisibilitySection },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function ThemeDebugPage() {
  // 选中项**故意不放 URL**：放进去的话每点一次分类就压一条 history，
  // 在调试页里来回翻十几次之后，浏览器的后退键就废了。
  const [selected, setSelected] = useState<SectionId>(SECTIONS[0].id)

  const Active = SECTIONS.find((item) => item.id === selected)?.Component ?? SECTIONS[0].Component

  // 换分类时把页面拉回顶部：不这么做的话，在一节里滚到一半再点另一节，
  // 会直接落在对方的中间，看起来像"点错了"。
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [selected])

  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div>
            <h1 className="font-heading text-lg font-semibold">Theme Debug</h1>
            <p className="text-xs text-muted-foreground">
              Every component in web/src/components/
              {'{motion,agents,charts}'}, rendered against our tokens.
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        {/* 主题开关常驻页面最上面，翻页翻不走 —— 改完立刻想看别的分类时不用翻回来 */}
        <ThemeSection />

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/*
            `self-start` 不能少：grid 子项默认 `stretch`，不加的话这个盒子会被拉到
            跟内容一样高，`sticky` 就没有可滑动的余量了（表现为"根本不粘"）。
            上面 header 约 68px，所以 `top-20`（80px）刚好留出间距。
          */}
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:self-start lg:overflow-y-auto">
            <SectionNav items={SECTIONS} value={selected} onChange={setSelected} />
          </div>
          {/* `minmax(0,1fr)` 配 `min-w-0`：不然宽表格 / 图表会把这一列顶爆，整页横向滚动 */}
          <div className="min-w-0">
            <Active />
          </div>
        </div>
      </div>
    </main>
  )
}
