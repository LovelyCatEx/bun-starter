import { FileText, Plus, Search, Settings, Users } from 'lucide-react'
import { useState } from 'react'

import {
  AnimatedToastStack,
  useAnimatedToastStack,
} from '@/components/motion/animated-toast-stack'
import { BottomSheet } from '@/components/motion/bottom-sheet'
import { Button } from '@/components/motion/button'
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
  CenterMorphModalTrigger,
} from '@/components/motion/center-morph-modal'
import { CommandPalette } from '@/components/motion/command-palette'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/motion/context-menu'
import { Drawer } from '@/components/motion/drawer'
import {
  DynamicIsland,
  DynamicIslandView,
} from '@/components/motion/dynamic-island'
import { FeedbackWidget } from '@/components/motion/feedback-widget'
import { MorphingModal } from '@/components/motion/morphing-modal'
import { MorphingSearch } from '@/components/motion/morphing-search'
import { NotificationStack } from '@/components/motion/notification-stack'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/motion/popover'
import {
  MorphPopover,
  MorphPopoverContent,
  MorphPopoverTrigger,
} from '@/components/motion/popover-morph'
import { PullToRefresh } from '@/components/motion/pull-to-refresh'
import { Tooltip } from '@/components/motion/tooltip'
import { TooltipSurface } from '@/components/motion/tooltip-surface'
import { Demo, Section } from '@/pages/debug/components/section'

/** Just enough rows for the pull gesture to have somewhere to go. */
const REFRESH_ROWS = Array.from({ length: 12 }, (_, index) => index + 1)

const SHEET_ROWS = ['Inbox', 'Starred', 'Drafts', 'Archive', 'Spam', 'Trash']

/**
 * Every component here is portalled and exists only while open, so each demo
 * needs its own open state. English on purpose: the debug page is exempt from
 * i18n — see `.claude/rules/frontend.md`.
 */
export function OverlaySection() {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [morphPopoverOpen, setMorphPopoverOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuWordWrap, setMenuWordWrap] = useState(true)
  const [menuDensity, setMenuDensity] = useState('comfortable')
  const [menuAction, setMenuAction] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [palettePick, setPalettePick] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchPick, setSearchPick] = useState<string | null>(null)
  const [modalView, setModalView] = useState<string | null>(null)
  const [centerOpen, setCenterOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [islandView, setIslandView] = useState<string | null>(null)
  const [pullCount, setPullCount] = useState(0)

  // A second, independent stack, local to the demo so its toasts stay inside
  // the box instead of escaping to the viewport.
  const { toasts, showToast, updateToast, dismissToast, clearToasts } =
    useAnimatedToastStack()

  const runCommand = (label: string) => {
    setPalettePick(label)
    setPaletteOpen(false)
  }

  return (
    <Section
      title="Overlays & feedback"
      description="Popovers, tooltips, menus, modals, sheets, toasts and the small pieces that hang off them. Everything is portalled, so each demo brings its own open state."
    >
      <Demo label="popover">
        <Popover
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          side="bottom"
          align="start"
        >
          <PopoverTrigger>
            <Button variant="secondary">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <p className="text-sm font-medium text-foreground">Gooey popover</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The panel oozes out of the trigger corner and the neck between them
              is an SVG filter, so `gooStrength` is what changes how much it
              melts. Escape or an outside press closes it.
            </p>
          </PopoverContent>
        </Popover>
      </Demo>

      <Demo label="popover-morph">
        <MorphPopover open={morphPopoverOpen} onOpenChange={setMorphPopoverOpen}>
          <MorphPopoverTrigger>
            <Button variant="secondary">Open morph popover</Button>
          </MorphPopoverTrigger>
          <MorphPopoverContent
            side="bottom"
            align="end"
            sideOffset={8}
            radius={16}
            className="w-64 p-4"
          >
            <p className="text-sm font-medium text-foreground">Corner morph</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Same panel idea, different entrance: it is laid out at full size
              and clipped to the trigger corner, then unclips as one piece. No
              goo layer, so `radius` and `align` are the knobs.
            </p>
          </MorphPopoverContent>
        </MorphPopover>
      </Demo>

      <Demo label="tooltip">
        <Tooltip
          content="Saved to your workspace"
          side="top"
          open={tooltipOpen}
          onOpenChange={setTooltipOpen}
        >
          <Button variant="secondary" size="sm">
            Hover, focus or tap me
          </Button>
        </Tooltip>
        <span className="text-xs text-muted-foreground">
          controlled open: {String(tooltipOpen)}
        </span>
        <Tooltip content="I follow the pointer" followCursor delay={0} side="top">
          <Button variant="ghost" size="sm">
            followCursor
          </Button>
        </Tooltip>
      </Demo>

      <Demo label="tooltip-surface">
        <TooltipSurface side="top">Presentation only</TooltipSurface>
        <TooltipSurface side="bottom">No measurement, no positioning</TooltipSurface>
        <p className="w-full text-xs text-muted-foreground">
          The bubble on its own, for callers that already know where to put it.
          The real `Tooltip` renders it through a positioner that measures the
          anchor first and only then starts the entrance.
        </p>
      </Demo>

      <Demo label="context-menu">
        <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <ContextMenuTrigger>
            <div className="flex h-24 w-64 cursor-context-menu items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Right-click, long-press, or press Shift+F10
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Edit</ContextMenuLabel>
            <ContextMenuItem onSelect={() => setMenuAction('Cut')}>
              Cut
              <ContextMenuShortcut>⌘X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setMenuAction('Copy')}>
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled>
              Paste
              <ContextMenuShortcut>⌘V</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuLabel>View</ContextMenuLabel>
            <ContextMenuCheckboxItem
              checked={menuWordWrap}
              onCheckedChange={setMenuWordWrap}
            >
              Word wrap
            </ContextMenuCheckboxItem>
            <ContextMenuRadioGroup
              value={menuDensity}
              onValueChange={setMenuDensity}
            >
              <ContextMenuRadioItem value="comfortable">
                Comfortable
              </ContextMenuRadioItem>
              <ContextMenuRadioItem value="compact">Compact</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
            <ContextMenuSeparator />
            <ContextMenuItem
              tone="destructive"
              onSelect={() => setMenuAction('Delete')}
            >
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <p className="w-full text-xs text-muted-foreground">
          word wrap: {String(menuWordWrap)} · density: {menuDensity} · last item:{' '}
          {menuAction ?? 'none'}
        </p>
      </Demo>

      <Demo label="command-palette">
        <Button variant="secondary" onClick={() => setPaletteOpen(true)}>
          Open command palette
        </Button>
        <span className="text-xs text-muted-foreground">
          also bound to ⌘K / Ctrl+K while this page is mounted
        </span>
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          placeholder="Type a command or search…"
          items={[
            {
              id: 'new-file',
              label: 'New file',
              group: 'Create',
              hint: '⌘N',
              icon: Plus,
              onSelect: () => runCommand('New file'),
            },
            {
              id: 'invite',
              label: 'Invite teammate',
              group: 'Create',
              icon: Users,
              keywords: ['member', 'share'],
              onSelect: () => runCommand('Invite teammate'),
            },
            {
              id: 'docs',
              label: 'Open documentation',
              group: 'Go to',
              icon: FileText,
              onSelect: () => runCommand('Open documentation'),
            },
            {
              id: 'settings',
              label: 'Settings',
              group: 'Go to',
              hint: '⌘,',
              icon: Settings,
              onSelect: () => runCommand('Settings'),
            },
          ]}
        />
        <p className="w-full text-xs text-muted-foreground">
          last command: {palettePick ?? 'none'}
        </p>
      </Demo>

      <Demo label="morphing-search">
        <MorphingSearch
          open={searchOpen}
          onOpenChange={setSearchOpen}
          placeholder="Search the workspace"
          shortcut="f"
          items={[
            {
              id: 'reports',
              title: 'Reports',
              description: 'Saved views and exports',
              keywords: ['export', 'csv'],
              icon: FileText,
              onSelect: () => setSearchPick('Reports'),
            },
            {
              id: 'people',
              title: 'People',
              description: 'Teammates and their roles',
              icon: Users,
              onSelect: () => setSearchPick('People'),
            },
            {
              id: 'preferences',
              title: 'Preferences',
              description: 'Theme, language, shortcuts',
              icon: Settings,
              onSelect: () => setSearchPick('Preferences'),
            },
          ]}
        />
        <p className="w-full text-xs text-muted-foreground">
          last result: {searchPick ?? 'none'}
        </p>
      </Demo>

      <Demo label="morphing-modal">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setModalView('plan')}>
            Open modal
          </Button>
          <span className="text-xs text-muted-foreground">
            view: {modalView ?? 'closed'}
          </span>
        </div>
        <MorphingModal
          viewId={modalView}
          onClose={() => setModalView(null)}
          placement="center"
        >
          {modalView === 'confirm' ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-semibold text-foreground">
                You are all set
              </h3>
              <p className="text-sm text-muted-foreground">
                The panel is keyed by `viewId`, so swapping it cross-fades the
                content while the shell stays put.
              </p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setModalView('plan')}>
                  Back
                </Button>
                <Button size="sm" onClick={() => setModalView(null)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-semibold text-foreground">
                Pick a plan
              </h3>
              <p className="text-sm text-muted-foreground">
                A backdrop press or Escape closes it. `placement` switches
                between a bottom sheet feel and a centred panel.
              </p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setModalView(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setModalView('confirm')}>
                  Continue
                </Button>
              </div>
            </div>
          )}
        </MorphingModal>
      </Demo>

      <Demo label="center-morph-modal">
        <CenterMorphModal open={centerOpen} onOpenChange={setCenterOpen}>
          <CenterMorphModalTrigger>
            <Button variant="secondary">Open center modal</Button>
          </CenterMorphModalTrigger>
          <CenterMorphModalContent
            ariaLabel="Rename workspace"
            className="max-w-sm p-6"
          >
            <h3 className="text-base font-semibold text-foreground">
              Rename workspace
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The surface unfolds outward from its own centre — a clip-path
              animation, so nothing is ever scaled or squashed on the way in.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <CenterMorphModalClose>
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
              </CenterMorphModalClose>
              <CenterMorphModalClose>
                <Button size="sm">Save</Button>
              </CenterMorphModalClose>
            </div>
          </CenterMorphModalContent>
        </CenterMorphModal>
      </Demo>

      <Demo label="drawer">
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          Open drawer
        </Button>
        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          side="right"
          ariaLabel="Demo drawer"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-foreground">Filters</span>
            <Button size="sm" variant="ghost" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
          </div>
          <div className="flex flex-col gap-2 p-4 text-sm text-muted-foreground">
            <p>
              `side` flips it to the left edge; the backdrop is a real button, so
              a press anywhere outside dismisses it (unless `dismissable` is
              false).
            </p>
          </div>
        </Drawer>
      </Demo>

      <Demo label="bottom-sheet">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Open bottom sheet
        </Button>
        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          snapPoints={[0.4, 0.85]}
          title="Mailboxes"
          description="Drag the pill up for the second snap point, down to dismiss."
        >
          <div className="flex flex-col gap-2">
            {SHEET_ROWS.map((row) => (
              <div
                key={row}
                className="rounded-lg border border-border px-3 py-2 text-sm text-foreground"
              >
                {row}
              </div>
            ))}
          </div>
        </BottomSheet>
      </Demo>

      <Demo label="notification-stack">
        <NotificationStack
          items={[
            {
              id: 'deploy',
              title: 'Deploy finished',
              description: 'web@1.4.2 is live in production.',
              trailing: '2m',
            },
            {
              id: 'review',
              title: 'Review requested',
              description: 'Alice asked you to look at #482.',
              trailing: '9m',
            },
            {
              id: 'billing',
              title: 'Invoice paid',
              description: 'Receipt sent to billing@example.com.',
              trailing: '1h',
            },
          ]}
          collapsedLabel="Notifications"
          expandedLabel="View all"
        />
        <p className="w-full text-xs text-muted-foreground">
          Hover, focus or tap the stack to fan the cards out. `maxVisible` caps
          how many are previewed before the rest collapse into the count badge.
        </p>
      </Demo>

      <Demo label="animated-toast-stack">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast({ title: 'Nothing to report', status: 'neutral' })}
          >
            neutral
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              showToast({
                title: 'Sync in progress',
                description: 'Pulling the latest from origin.',
                status: 'info',
              })
            }
          >
            info
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              showToast({
                title: 'Deploy complete',
                description: 'web@1.4.2 is live.',
                status: 'success',
                action: { label: 'Undo', onClick: (toast) => dismissToast(toast.id) },
              })
            }
          >
            success + action
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              showToast({
                title: 'Upload failed',
                description: 'The connection dropped.',
                status: 'error',
                duration: 0,
              })
            }
          >
            error (sticky)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const id = showToast({
                title: 'Uploading report.pdf',
                status: 'loading',
                duration: 0,
              })
              setTimeout(() => {
                updateToast(id, {
                  title: 'Report uploaded',
                  status: 'success',
                  duration: 3000,
                })
              }, 1400)
            }}
          >
            loading → success
          </Button>
          <Button size="sm" variant="ghost" onClick={clearToasts}>
            Clear
          </Button>
        </div>
        {/* No `fixed`: the default `static` placement drops the stack into the
            document flow, which is what a contained demo wants. */}
        <AnimatedToastStack
          toasts={toasts}
          onDismiss={dismissToast}
          className="w-full"
        />
      </Demo>

      <Demo label="feedback-widget" height={380}>
        {/* The widget pins itself to the bottom-right of whatever box it is in,
            so the framing `Demo` is doing real work here. */}
        <FeedbackWidget
          onSubmit={async () => {
            await new Promise((resolve) => setTimeout(resolve, 800))
          }}
        />
      </Demo>

      <Demo label="dynamic-island">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant={islandView === 'playing' ? 'primary' : 'secondary'}
            onClick={() => setIslandView(islandView === 'playing' ? null : 'playing')}
          >
            Now playing
          </Button>
          <Button
            size="sm"
            variant={islandView === 'call' ? 'primary' : 'secondary'}
            onClick={() => setIslandView(islandView === 'call' ? null : 'call')}
          >
            Incoming call
          </Button>
        </div>
        <DynamicIsland
          view={islandView}
          compact={<span>idle</span>}
          className="mt-2"
        >
          <DynamicIslandView id="playing">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-background/15">
                <Search className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-xs font-medium">Midnight City</span>
                <span className="text-[11px] opacity-70">M83 · Hurry Up</span>
              </span>
            </div>
          </DynamicIslandView>
          <DynamicIslandView id="call">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-background/15">
                <Users className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-xs font-medium">Alice</span>
                <span className="text-[11px] opacity-70">Incoming call…</span>
              </span>
              <Button size="sm" onClick={() => setIslandView(null)}>
                Answer
              </Button>
            </div>
          </DynamicIslandView>
        </DynamicIsland>
        <p className="w-full text-xs text-muted-foreground">
          Pass `view={null}` for the compact pill; each `DynamicIslandView` shows
          only while its `id` matches.
        </p>
      </Demo>

      <Demo label="pull-to-refresh" height={400}>
        <PullToRefresh
          className="h-full"
          ariaLabel="Pull to refresh demo"
          onRefresh={async () => {
            await new Promise((resolve) => setTimeout(resolve, 900))
            setPullCount((count) => count + 1)
          }}
        >
          <div className="flex flex-col gap-2 p-4">
            <p className="text-xs text-muted-foreground">
              Refreshed {pullCount} {pullCount === 1 ? 'time' : 'times'} · drag
              down from the top of this box
            </p>
            {REFRESH_ROWS.map((row) => (
              <div
                key={row}
                className="rounded-lg border border-border px-3 py-2 text-sm text-foreground"
              >
                Row {row}
              </div>
            ))}
          </div>
        </PullToRefresh>
      </Demo>
    </Section>
  )
}
