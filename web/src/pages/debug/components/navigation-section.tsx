import {
  Archive,
  Bell,
  Bookmark,
  Calendar,
  Check,
  FileCode,
  Home,
  Inbox,
  LayoutDashboard,
  Layers,
  Mail,
  PanelLeft,
  Pencil,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarHeader,
  AnimatedSidebarInset,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuSub,
  AnimatedSidebarMenuSubButton,
  AnimatedSidebarMenuSubItem,
  AnimatedSidebarProvider,
  AnimatedSidebarTrigger,
} from '@/components/motion/animated-sidebar'
import { BounceSidebar, type BounceSidebarItem } from '@/components/motion/bounce-sidebar'
import { BouncyAccordion, type BouncyAccordionItem } from '@/components/motion/bouncy-accordion'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/motion/breadcrumb'
import { Button } from '@/components/motion/button'
import { Dock, DockItem, DockSeparator } from '@/components/motion/dock'
import { ExpandableTabs, type ExpandableTabsItem } from '@/components/motion/expandable-tabs'
import { FileTree, FileTreeFile, FileTreeFolder } from '@/components/motion/file-tree'
import { MorphingTabs, type MorphingTabsItem } from '@/components/motion/morphing-tabs'
import { PreviewRail, type PreviewRailItem } from '@/components/motion/preview-rail'
import {
  SwipeableList,
  type SwipeableListItem,
  type SwipeableListValue,
} from '@/components/motion/swipeable-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/motion/tabs'
import { Tooltip } from '@/components/motion/tooltip'
import { Demo, Section } from '@/pages/debug/components/section'

const TAB_ITEMS = [
  {
    value: 'overview',
    label: 'Overview',
    body: 'The three variants share one selection: switch a tab in any of them and the others follow.',
  },
  {
    value: 'activity',
    label: 'Activity',
    body: 'The pill rides between triggers with a shared layout animation; underline only slides its rule.',
  },
  {
    value: 'settings',
    label: 'Settings',
    body: 'Panels stay mounted while inactive — hidden, so their content is still in the DOM.',
  },
]

const TAB_VARIANTS = ['pill', 'underline', 'segment'] as const

const MORPH_ITEMS: MorphingTabsItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Layers className="size-4" aria-hidden="true" />,
    content: (
      <div className="p-5 text-sm opacity-80">
        Drag a tab sideways to reorder it — the liquid surface follows the pointer and the rail
        springs the other tabs into their new slots. Every tab is a real panel: the active one cuts
        its own notch into the surface below.
      </div>
    ),
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: <Zap className="size-4" aria-hidden="true" />,
    content: (
      <div className="p-5 text-sm opacity-80">
        Switching swaps the panel with a blur-and-lift transition. Alt + Arrow Left/Right reorders
        the focused tab from the keyboard, which is the same commit a drag performs.
      </div>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="size-4" aria-hidden="true" />,
    content: (
      <div className="p-5 text-sm opacity-80">
        The rail never scrolls: slots narrow instead, in tiers, so the notch is always over the tab
        that cut it. Resize the window to watch the slots shrink.
      </div>
    ),
  },
]

const EXPANDABLE_ITEMS: ExpandableTabsItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="size-4" aria-hidden="true" />,
    content: (
      <div className="w-max px-2 pb-1 text-xs text-muted-foreground">
        The shell measures this panel and springs to fit it.
      </div>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Search className="size-4" aria-hidden="true" />,
    content: (
      <div className="w-max px-2 pb-1 text-xs text-muted-foreground">
        Selecting the open tab again closes the bar.
      </div>
    ),
  },
  {
    id: 'mail',
    label: 'Mail',
    icon: <Mail className="size-4" aria-hidden="true" />,
    content: (
      <div className="w-max px-2 pb-1 text-xs text-muted-foreground">
        Click outside or press Escape to close it.
      </div>
    ),
  },
  {
    id: 'bell',
    label: 'Alerts',
    icon: <Bell className="size-4" aria-hidden="true" />,
    content: (
      <div className="w-max px-2 pb-1 text-xs text-muted-foreground">
        The label slides out of the active icon only.
      </div>
    ),
  },
]

const TRAIL = ['Workspace', 'Projects', 'bun-starter', 'web', 'src', 'components', 'motion']

const DOCK_MAIN = [
  { id: 'home', label: 'Home', icon: <Home className="size-5" aria-hidden="true" /> },
  { id: 'search', label: 'Search', icon: <Search className="size-5" aria-hidden="true" /> },
  { id: 'mail', label: 'Mail', icon: <Mail className="size-5" aria-hidden="true" /> },
  { id: 'files', label: 'Files', icon: <FileCode className="size-5" aria-hidden="true" /> },
]

const DOCK_TRAILING = [
  { id: 'saved', label: 'Saved', icon: <Bookmark className="size-5" aria-hidden="true" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="size-5" aria-hidden="true" /> },
]

const SIDEBAR_ITEMS: BounceSidebarItem[] = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox className="size-4" aria-hidden="true" /> },
  { id: 'saved', label: 'Saved', icon: <Bookmark className="size-4" aria-hidden="true" /> },
  { id: 'drafts', label: 'Drafts', icon: <Pencil className="size-4" aria-hidden="true" /> },
  { id: 'team', label: 'Team', icon: <Users className="size-4" aria-hidden="true" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="size-4" aria-hidden="true" /> },
]

const RAIL_ITEMS: PreviewRailItem[] = [
  {
    id: 'install',
    label: 'Install',
    description: 'bun install, then bun run dev. The two workspaces start side by side.',
  },
  {
    id: 'contracts',
    label: 'Shared contracts',
    description: 'shared/ holds the envelopes and DTOs both ends compile against.',
  },
  {
    id: 'database',
    label: 'Database',
    description: 'Drizzle migrations run on boot, from the folder or from inside the binary.',
  },
  {
    id: 'packaging',
    label: 'Packaging',
    description: 'One file, one port: vite build, the native helpers, then bun build --compile.',
  },
  {
    id: 'shipping',
    label: 'Shipping',
    description: 'The debug page is deleted before release, so nothing here is translated.',
  },
]

const SWIPE_ITEMS: SwipeableListItem[] = [
  {
    id: 'inbox',
    title: 'Inbox',
    description: '3 unread messages',
    meta: 'now',
    leading: <Mail className="size-5 text-muted-foreground" aria-hidden="true" />,
    leftActions: [
      {
        id: 'star',
        label: 'Star',
        icon: <Star className="size-4" aria-hidden="true" />,
        tone: 'warning',
      },
    ],
    rightActions: [
      {
        id: 'archive',
        label: 'Archive',
        icon: <Archive className="size-4" aria-hidden="true" />,
        tone: 'primary',
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="size-4" aria-hidden="true" />,
        tone: 'danger',
      },
    ],
  },
  {
    id: 'drafts',
    title: 'Drafts',
    description: 'Two unpublished notes',
    meta: '2d',
    leading: <Pencil className="size-5 text-muted-foreground" aria-hidden="true" />,
    rightActions: [
      {
        id: 'publish',
        label: 'Publish',
        icon: <Send className="size-4" aria-hidden="true" />,
        tone: 'success',
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="size-4" aria-hidden="true" />,
        tone: 'danger',
      },
    ],
  },
  {
    id: 'done',
    title: 'Completed',
    description: 'Nothing left to do',
    meta: '1w',
    leading: <Check className="size-5 text-muted-foreground" aria-hidden="true" />,
    rightActions: [
      {
        id: 'archive',
        label: 'Archive',
        icon: <Archive className="size-4" aria-hidden="true" />,
        tone: 'neutral',
      },
    ],
  },
]

const ACCORDION_ITEMS: BouncyAccordionItem[] = [
  {
    id: 'shells',
    title: 'Motion shells',
    description:
      'Each row keeps its own corner radii and springs them when the group opens or closes, so neighbours read as one surface while they move.',
    icon: <Sparkles className="size-4" aria-hidden="true" />,
  },
  {
    id: 'tokens',
    title: 'Semantic tokens',
    description:
      'Surfaces are `bg-card` over `border-border`, so the same row stays correct through all four colour modes without a single hard-coded colour.',
    icon: <ShieldCheck className="size-4" aria-hidden="true" />,
  },
  {
    id: 'rendering',
    title: 'Rendering budget',
    description:
      'The open panel animates height against a measured content box, and only one item is open at a time unless you ask otherwise.',
    icon: <Zap className="size-4" aria-hidden="true" />,
  },
]

/**
 * Showcase for the navigation components in `web/src/components/motion/`.
 *
 * Every interactive demo keeps its state here — the tab, the open sidebar, the expanded
 * accordion, the swiped row — because a navigation component that does not answer a click is
 * not worth showing.
 *
 * English and hard-coded on purpose — the debug page is exempt from the i18n rules
 * (see `.claude/rules/frontend.md`).
 */
export function NavigationSection() {
  const [tab, setTab] = useState(TAB_ITEMS[0].value)
  const [morphTab, setMorphTab] = useState<string | null>('overview')
  const [expandTab, setExpandTab] = useState<string | null>(null)
  const [crumbDepth, setCrumbDepth] = useState(3)
  const [dockActive, setDockActive] = useState('home')
  const [railActive, setRailActive] = useState('install')
  const [bounceActive, setBounceActive] = useState('inbox')
  const [accordion, setAccordion] = useState<string | null>('shells')
  const [swiped, setSwiped] = useState<SwipeableListValue | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [treeFile, setTreeFile] = useState('file-main')
  const [treeExpanded, setTreeExpanded] = useState(['web', 'web-src'])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarPage, setSidebarPage] = useState('dashboard')
  const [agentsOpen, setAgentsOpen] = useState(true)

  const crumbs = TRAIL.slice(0, crumbDepth)

  return (
    <Section
      title="Navigation"
      description="Tabs and sidebars — the components that pick where you are. Selection, collapse state and the swipe gesture all live in this section, so everything below answers a click."
    >
      <Demo label="tabs">
        <div className="flex w-full max-w-xl flex-col gap-4">
          {TAB_VARIANTS.map((variant) => (
            <div key={variant} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{variant}</span>
              <Tabs variant={variant} value={tab} onValueChange={setTab}>
                <TabsList>
                  {TAB_ITEMS.map((item) => (
                    <TabsTrigger key={item.value} value={item.value}>
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {variant === 'pill'
                  ? TAB_ITEMS.map((item) => (
                      <TabsContent key={item.value} value={item.value}>
                        <p className="text-sm text-muted-foreground">{item.body}</p>
                      </TabsContent>
                    ))
                  : null}
              </Tabs>
            </div>
          ))}
        </div>
      </Demo>

      <Demo label="morphing-tabs">
        <div className="w-full max-w-xl">
          <MorphingTabs
            ariaLabel="Workspace tabs"
            items={MORPH_ITEMS}
            value={morphTab}
            onValueChange={setMorphTab}
          />
        </div>
      </Demo>

      <Demo label="expandable-tabs">
        <div className="w-full max-w-md">
          <ExpandableTabs
            items={EXPANDABLE_ITEMS}
            value={expandTab}
            onValueChange={setExpandTab}
          />
        </div>
      </Demo>

      <Demo label="breadcrumb">
        <div className="flex w-full flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList maxItems={Infinity}>
              {crumbs.map((crumb, index) => (
                <BreadcrumbItem key={crumb}>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  {index === crumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink>{crumb}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCrumbDepth((depth) => Math.min(TRAIL.length, depth + 1))}
              disabled={crumbDepth >= TRAIL.length}
            >
              Go deeper
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCrumbDepth((depth) => Math.max(1, depth - 1))}
              disabled={crumbDepth <= 1}
            >
              Go up
            </Button>
            <span className="text-xs text-muted-foreground">{crumbDepth} levels</span>
          </div>

          <Breadcrumb>
            <BreadcrumbList maxItems={3} overflowLabel="Show the hidden folders">
              {TRAIL.map((crumb, index) => (
                <BreadcrumbItem key={crumb}>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  {index === TRAIL.length - 1 ? (
                    <BreadcrumbPage>{crumb}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink>{crumb}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </Demo>

      <p className="text-xs text-muted-foreground">
        The last breadcrumb sets `maxItems={3}`: everything between the root and the current page
        folds into the ellipsis, which opens on hover, on tap and from the keyboard. The first one
        takes `maxItems={Infinity}` so adding a level animates the new crumb in.
      </p>

      <Demo label="dock" height={420}>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <Dock size={52}>
            {DOCK_MAIN.map((item) => (
              <Tooltip key={item.id} content={item.label}>
                <DockItem
                  aria-label={item.label}
                  active={dockActive === item.id}
                  onClick={() => setDockActive(item.id)}
                >
                  {item.icon}
                </DockItem>
              </Tooltip>
            ))}
            <DockSeparator />
            {DOCK_TRAILING.map((item) => (
              <Tooltip key={item.id} content={item.label}>
                <DockItem
                  aria-label={item.label}
                  active={dockActive === item.id}
                  onClick={() => setDockActive(item.id)}
                >
                  {item.icon}
                </DockItem>
              </Tooltip>
            ))}
          </Dock>
          <p className="text-xs text-muted-foreground">
            Hover an item for its tooltip. Selected:{' '}
            <span className="text-foreground">{dockActive}</span>
          </p>
        </div>
      </Demo>

      <Demo label="file-tree" height={420}>
        <div className="flex h-full justify-center p-4">
          <div className="w-full max-w-xs">
            <FileTree
              ariaLabel="Project files"
              value={treeFile}
              onValueChange={setTreeFile}
              expandedIds={treeExpanded}
              onExpandedChange={setTreeExpanded}
              indent={14}
            >
              <FileTreeFolder value="web" name="web">
                <FileTreeFolder value="web-src" name="src">
                  <FileTreeFolder value="web-components" name="components">
                    <FileTreeFile value="file-tabs" name="tabs.tsx" />
                    <FileTreeFile value="file-dock" name="dock.tsx" />
                    <FileTreeFile value="file-preview" name="preview-rail.tsx" />
                  </FileTreeFolder>
                  <FileTreeFile value="file-main" name="main.tsx" />
                </FileTreeFolder>
                <FileTreeFile value="file-vite" name="vite.config.ts" />
              </FileTreeFolder>
              <FileTreeFolder value="server" name="server">
                <FileTreeFile value="file-app" name="app.ts" />
              </FileTreeFolder>
              <FileTreeFile value="file-readme" name="README.md" />
              <FileTreeFile value="file-lock" name="bun.lock" disabled />
            </FileTree>
            <p className="mt-3 px-2 text-xs text-muted-foreground">
              Selected: <span className="text-foreground">{treeFile}</span>
            </p>
          </div>
        </div>
      </Demo>

      <Demo label="animated-sidebar" height={420}>
        <AnimatedSidebarProvider
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          className="h-full min-h-0"
        >
          <AnimatedSidebar
            ariaLabel="Demo sidebar"
            collapsible="icon"
            className="h-full"
            panelClassName="h-full"
          >
            <AnimatedSidebarHeader>
              <div className="flex h-9 items-center gap-2 overflow-hidden px-1 text-sm font-semibold">
                <Layers className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Acme</span>
              </div>
            </AnimatedSidebarHeader>

            <AnimatedSidebarContent>
              <AnimatedSidebarGroup>
                <AnimatedSidebarGroupLabel>Workspace</AnimatedSidebarGroupLabel>
                <AnimatedSidebarGroupContent>
                  <AnimatedSidebarMenu>
                    <AnimatedSidebarMenuItem>
                      <AnimatedSidebarMenuButton
                        icon={<LayoutDashboard className="size-4" aria-hidden="true" />}
                        isActive={sidebarPage === 'dashboard'}
                        onSelect={() => setSidebarPage('dashboard')}
                      >
                        Dashboard
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuItem>
                      <AnimatedSidebarMenuButton
                        icon={<Inbox className="size-4" aria-hidden="true" />}
                        badge="3"
                        isActive={sidebarPage === 'inbox'}
                        onSelect={() => setSidebarPage('inbox')}
                      >
                        Inbox
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuItem>
                      <AnimatedSidebarMenuButton
                        icon={<Calendar className="size-4" aria-hidden="true" />}
                        isActive={sidebarPage === 'calendar'}
                        onSelect={() => setSidebarPage('calendar')}
                      >
                        Calendar
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                  </AnimatedSidebarMenu>
                </AnimatedSidebarGroupContent>
              </AnimatedSidebarGroup>

              <AnimatedSidebarGroup>
                <AnimatedSidebarGroupLabel>Platform</AnimatedSidebarGroupLabel>
                <AnimatedSidebarGroupContent>
                  <AnimatedSidebarMenu>
                    <AnimatedSidebarMenuItem>
                      <AnimatedSidebarMenuButton
                        icon={<Users className="size-4" aria-hidden="true" />}
                        ariaExpanded={agentsOpen}
                        isActive={sidebarPage.startsWith('agent')}
                        onSelect={() => setAgentsOpen((open) => !open)}
                      >
                        Agents
                      </AnimatedSidebarMenuButton>
                      <AnimatedSidebarMenuSub open={agentsOpen}>
                        <AnimatedSidebarMenuSubItem>
                          <AnimatedSidebarMenuSubButton
                            isActive={sidebarPage === 'agent-planner'}
                            onSelect={() => setSidebarPage('agent-planner')}
                          >
                            Planner
                          </AnimatedSidebarMenuSubButton>
                        </AnimatedSidebarMenuSubItem>
                        <AnimatedSidebarMenuSubItem>
                          <AnimatedSidebarMenuSubButton
                            isActive={sidebarPage === 'agent-reviewer'}
                            onSelect={() => setSidebarPage('agent-reviewer')}
                          >
                            Reviewer
                          </AnimatedSidebarMenuSubButton>
                        </AnimatedSidebarMenuSubItem>
                      </AnimatedSidebarMenuSub>
                    </AnimatedSidebarMenuItem>
                  </AnimatedSidebarMenu>
                </AnimatedSidebarGroupContent>
              </AnimatedSidebarGroup>
            </AnimatedSidebarContent>

            <AnimatedSidebarFooter>
              <p className="truncate px-2 text-xs text-muted-foreground">
                {sidebarOpen ? 'expanded' : 'collapsed'}
              </p>
            </AnimatedSidebarFooter>
          </AnimatedSidebar>

          <AnimatedSidebarInset className="h-full min-h-0">
            <div className="flex items-center gap-2 border-b border-border p-2">
              <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted/60">
                <PanelLeft className="size-4" aria-hidden="true" />
              </AnimatedSidebarTrigger>
              <span className="truncate text-xs text-muted-foreground">
                {sidebarPage} · the rail collapses to icons, or reach for ⌘B / Ctrl+B
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-4 text-sm text-muted-foreground">
              Selecting a group unfolds the panel when the rail is collapsed — a submenu has nowhere
              to render in a 68px rail.
            </div>
          </AnimatedSidebarInset>
        </AnimatedSidebarProvider>
      </Demo>

      <p className="text-xs text-muted-foreground">
        The sidebar here is the desktop rail (`hidden md:block`). Below 768px the same component
        portals a sheet over the viewport instead, which is why the demo keeps the desktop branch.
      </p>

      <Demo label="bounce-sidebar" height={420}>
        <div className="flex h-full items-center p-6">
          <BounceSidebar
            ariaLabel="Mailbox sections"
            className="w-56"
            items={SIDEBAR_ITEMS}
            value={bounceActive}
            onValueChange={setBounceActive}
          />
        </div>
      </Demo>

      <Demo label="swipeable-list" height={420}>
        <div className="flex h-full w-full max-w-lg flex-col gap-3 p-4">
          <SwipeableList
            items={SWIPE_ITEMS}
            value={swiped}
            onValueChange={setSwiped}
            onAction={({ item, action }) => setLastAction(`${action.id} → ${item.id}`)}
          />
          <p className="text-xs text-muted-foreground">
            Drag a row sideways with the mouse (or a finger):{' '}
            {swiped ? `open — ${swiped.id} (${swiped.side})` : 'nothing open'}
            {lastAction ? ` · last action: ${lastAction}` : ''}
          </p>
        </div>
      </Demo>

      <Demo label="preview-rail" height={420}>
        <PreviewRail
          className="h-full"
          label="Guide sections"
          items={RAIL_ITEMS}
          activeId={railActive}
          onActiveChange={setRailActive}
          highlightActive
        />
      </Demo>

      <Demo label="bouncy-accordion">
        <div className="w-full max-w-xl">
          <BouncyAccordion
            items={ACCORDION_ITEMS}
            value={accordion}
            onValueChange={setAccordion}
          />
        </div>
      </Demo>
    </Section>
  )
}
