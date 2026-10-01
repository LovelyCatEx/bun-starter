import { useMotionValueEvent } from 'motion/react'
import { useState } from 'react'

import { CardFolder } from '@/components/motion/card-folder'
import { CylinderCarousel } from '@/components/motion/cylinder-carousel'
import { InfiniteMasonry } from '@/components/motion/infinite-masonry'
import { Loader, type LoaderVariant } from '@/components/motion/loader'
import { Parallax } from '@/components/motion/parallax'
import { ProjectFolder } from '@/components/motion/project-folder'
import { ScrollProgress } from '@/components/motion/scroll-progress'
import { ScrollReveal } from '@/components/motion/scroll-reveal'
import { ScrollTo } from '@/components/motion/scroll-to'
import { SmoothScroll, useSmoothScroll } from '@/components/motion/smooth-scroll'
import { TiltCard } from '@/components/motion/tilt-card'
import { Demo, Section } from '@/pages/debug/components/section'

/**
 * Scroll-driven widgets and three layout-owning showpieces. `SmoothScroll` is the
 * only one that takes over scrolling, so it is mounted scoped (`root={false}`); the
 * rest fall back to native scrolling. English: the debug page is exempt from i18n.
 */

const LOADER_VARIANTS: LoaderVariant[] = [
  'spinner',
  'dots',
  'bars',
  'dot-matrix',
  'dither',
  'ascii',
  'ascii-line',
  'ascii-braille',
  'ascii-blocks',
  'ascii-bounce',
  'morph',
  'comet',
  'scramble',
  'metaballs',
  'newton',
  'helix',
  'percent',
]

const PARALLAX_CARDS = [
  { speed: 0.35, axis: 'y', caption: 'speed 0.35 · y · foreground' },
  { speed: -0.25, axis: 'y', caption: 'speed -0.25 · y · background' },
  { speed: 0.25, axis: 'x', caption: 'speed 0.25 · x' },
] as const

/** Rows tall enough that the scoped Lenis box below actually has somewhere to scroll. */
const SCROLL_ROWS = Array.from({ length: 14 }, (_, index) => index + 1)

const MASONRY_HEIGHTS = [112, 152, 96, 136, 176, 104]

const FOLDER_PREVIEWS = [
  {
    id: 'tokens',
    content: <div className="size-full bg-gradient-to-br from-primary/70 to-primary/20" />,
  },
  {
    id: 'primitives',
    content: <div className="size-full bg-gradient-to-br from-chart-2/70 to-chart-2/20" />,
  },
  {
    id: 'motion',
    content: <div className="size-full bg-gradient-to-br from-chart-3/70 to-chart-3/20" />,
  },
]

const CAROUSEL_FACES = Array.from({ length: 8 }, (_, index) => index + 1)

/** Progress readout for the scoped provider — proof that the box really is on Lenis. */
function ScopedScrollReadout() {
  const { progress } = useSmoothScroll()
  const [percent, setPercent] = useState(0)

  useMotionValueEvent(progress, 'change', (value) => {
    setPercent(Math.round(value * 100))
  })

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-2 backdrop-blur">
      <span className="text-xs text-muted-foreground">
        useSmoothScroll().progress <span className="font-medium tabular-nums">{percent}%</span>
      </span>
      <span className="text-xs text-muted-foreground">scoped to this box</span>
    </div>
  )
}

/** The card-folder / project-folder previews need a filled card face, not a placeholder. */
function CardFace({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex size-full flex-col justify-between bg-gradient-to-br from-primary to-primary/70 p-4 text-primary-foreground">
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-80">
        {note}
      </span>
      <span className="text-lg font-medium leading-tight">{label}</span>
    </div>
  )
}

/** The masonry never fetches: it pages through a local counter so the load-more path is real. */
function InfiniteMasonryDemo() {
  const [count, setCount] = useState(12)
  const [loading, setLoading] = useState(false)
  const items = Array.from({ length: count }, (_, index) => index)

  const loadMore = () => {
    if (loading) return
    setLoading(true)
    window.setTimeout(() => {
      setCount((current) => current + 6)
      setLoading(false)
    }, 700)
  }

  return (
    <InfiniteMasonry
      ariaLabel="Infinite masonry demo"
      className="h-full"
      items={items}
      getItemKey={(item) => item}
      renderItem={(item) => (
        <div
          className="flex flex-col justify-between rounded-2xl border border-border bg-card p-3"
          style={{ height: MASONRY_HEIGHTS[item % MASONRY_HEIGHTS.length] }}
        >
          <span className="text-xs text-muted-foreground">Card</span>
          <span className="text-lg font-medium tabular-nums text-foreground">{item + 1}</span>
        </div>
      )}
      onLoadMore={loadMore}
      hasMore={count < 60}
      loading={loading}
      minColumnWidth={150}
      gap={12}
    />
  )
}

export function MotionSection() {
  return (
    <Section
      title="Scroll & motion"
      description="Everything that reacts to scrolling, the loaders, and three layout-owning showpieces (card-folder, project-folder, cylinder-carousel). The scroll widgets read this page's own scroll — scroll the page (not the boxes) to see them move."
    >
      <Demo label="scroll-reveal">
        {[0, 0.12, 0.24].map((delay) => (
          <ScrollReveal key={delay} delay={delay} className="w-44">
            <div className="flex h-32 flex-col justify-between rounded-xl border border-border bg-card p-4">
              <span className="text-xs text-muted-foreground">delay {delay}s</span>
              <span className="text-sm font-medium text-foreground">
                Slides up, un-blurs and fades in the first time it crosses the viewport.
              </span>
            </div>
          </ScrollReveal>
        ))}
      </Demo>

      <p className="text-xs text-muted-foreground">
        scroll-reveal defaults to `once` — scroll away and back and it stays put. Pass `once={'{false}'}`
        to replay on every entry, `root` to tie it to a contained scroller instead of the viewport,
        and `blur` / `y` / `duration` / `amount` to change the entrance.
      </p>

      <Demo label="scroll-progress">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-28 w-64 overflow-hidden rounded-xl border border-border bg-card">
            <ScrollProgress fixed={false} position="top" height={3} />
            <ScrollProgress fixed={false} position="bottom" height={3} className="bg-primary" />
            <p className="p-4 text-xs text-muted-foreground">
              Both bars are driven by the page scroll — `position` and `height`, `fixed={'{false}'}` to
              anchor them to an ancestor instead of the viewport.
            </p>
          </div>
          <ScrollProgress variant="circle" size={56} thickness={4} />
        </div>
      </Demo>

      <p className="text-xs text-muted-foreground">
        The default bar is `fixed` and would pin a 2px line to the top of the viewport for the whole
        page, so both bars here are `fixed={'{false}'}` inside a positioned box. `variant=&quot;circle&quot;`
        is the scroll-to-top ring on the right; `spring` smooths the value and switches itself off
        under reduced motion.
      </p>

      <Demo label="scroll-to">
        <div className="flex flex-wrap items-center gap-3">
          <ScrollTo
            to={0}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Scroll the page to the top
          </ScrollTo>
          <ScrollTo
            to="#motion-scroll-to-target"
            offset={-96}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Scroll to the box below
          </ScrollTo>
          <div
            id="motion-scroll-to-target"
            className="flex h-16 flex-1 items-center rounded-xl border border-dashed border-border px-4 text-xs text-muted-foreground"
          >
            The target: `to=&quot;#motion-scroll-to-target&quot;` plus `offset={'{-96}'}` to clear the
            sticky header.
          </div>
        </div>
      </Demo>

      <p className="text-xs text-muted-foreground">
        No provider is mounted for this one, so `useSmoothScroll()` falls back to
        `window.scrollTo({'{'} behavior: &quot;smooth&quot; {'}'})` — the page scrolls natively and
        nothing else on the page is affected. `to` also takes a px number or a raw element, and
        `duration` only matters on the Lenis path (see the next demo).
      </p>

      <Demo label="smooth-scroll" height={360}>
        <SmoothScroll root={false} className="h-full overflow-y-auto">
          <ScopedScrollReadout />
          <div className="flex flex-col gap-3 p-4">
            <ScrollTo
              to={0}
              className="self-start rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Lenis scrollTo(0)
            </ScrollTo>
            {SCROLL_ROWS.map((row) => (
              <div
                key={row}
                className="flex h-20 items-center rounded-xl border border-border bg-card px-4 text-sm text-foreground"
              >
                Row {row}
              </div>
            ))}
          </div>
        </SmoothScroll>
      </Demo>

      <p className="text-xs text-muted-foreground">
        Mounted scoped, on purpose: `root={'{false}'}` keeps Lenis on the box below instead of the
        window. Mounted with its default `root` (or at page level) this component hijacks the whole
        page's scrolling and fights the other sections, so it is the one demo here that is bounded to
        a container. Wheel inside the box to feel the smoothing; the page outside keeps native
        scrolling, and with `prefers-reduced-motion` the provider renders a plain scroll container
        whose native listeners feed the same progress value.
      </p>

      <Demo label="parallax">
        {PARALLAX_CARDS.map((card) => (
          <Parallax key={card.caption} speed={card.speed} axis={card.axis} className="w-44">
            <div className="flex h-32 flex-col justify-between rounded-xl border border-border bg-card p-4">
              <span className="text-xs text-muted-foreground">axis {card.axis}</span>
              <span className="text-sm font-medium text-foreground">{card.caption}</span>
            </div>
          </Parallax>
        ))}
      </Demo>

      <p className="text-xs text-muted-foreground">
        Drift is a fraction of the element&apos;s travel through the viewport, so positive moves with
        the scroll and negative against it. `container` points it at a contained scroller instead of
        the viewport, and the spring follow is dropped under reduced motion.
      </p>

      <Demo label="tilt-card">
        <TiltCard className="h-48 w-72 border border-border bg-card">
          <div className="flex size-full flex-col justify-between p-4">
            <span className="text-xs text-muted-foreground">tilt-card</span>
            <span className="text-sm font-medium text-foreground">
              Move the pointer across the card — the transform and the glare both follow it.
            </span>
          </div>
        </TiltCard>
        <TiltCard max={24} glare={false} className="h-48 w-72 border border-border bg-card">
          <div className="flex size-full flex-col justify-between p-4">
            <span className="text-xs text-muted-foreground">max={'{24}'} · glare={'{false}'}</span>
            <span className="text-sm font-medium text-foreground">
              Twice the rotation, no highlight layer.
            </span>
          </div>
        </TiltCard>
      </Demo>

      <p className="text-xs text-muted-foreground">
        The cursor-follow is skipped entirely without hover (touch) and under reduced motion, in
        which case the card is just a rounded box.
      </p>

      <Demo label="loader">
        {LOADER_VARIANTS.map((variant) => (
          <div
            key={variant}
            className="flex h-24 w-28 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card"
          >
            <Loader variant={variant} size={28} label={variant} />
            <span className="text-[10px] text-muted-foreground">{variant}</span>
          </div>
        ))}
      </Demo>

      <p className="text-xs text-muted-foreground">
        All 17 variants. `size` scales everything, `speed` is seconds per cycle, `label` is the
        screen-reader text, and reduced motion replaces each animation with a calm opacity pulse.
      </p>

      <Demo label="card-folder" height={460}>
        <div className="h-full w-full overflow-y-auto p-4">
          <div className="flex flex-wrap items-start gap-6">
            <CardFolder
              title="Studio card"
              cardNumber="4242 4242 4242 4242"
              expiry="04/29"
              cvv="314"
              card={<CardFace note="tucked" label="Press the folder" />}
            />
            <CardFolder
              title="Studio card"
              cardNumber="4242 4242 4242 4242"
              expiry="04/29"
              cvv="314"
              defaultOpen
              defaultDetailsVisible
              onAction={() => undefined}
              actionLabel="Card actions"
              card={<CardFace note="open" label="Uncontrolled, open" />}
            />
          </div>
          <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
            The left one is untouched state, the right one starts open with the details revealed. The
            eye button toggles the number and CVV masking, the folder press lifts the card out and
            collapses the purse, and `onAction` is what adds the ellipsis button. `card` is any node —
            here a token gradient instead of artwork.
          </p>
        </div>
      </Demo>

      <Demo label="project-folder" height={460}>
        <div className="h-full w-full overflow-y-auto p-4">
          <div className="flex flex-wrap items-start gap-8">
            <ProjectFolder
              title="Design system"
              description="Updated 2 hours ago"
              count={12}
              itemLabel="file"
              previews={FOLDER_PREVIEWS}
            />
            <ProjectFolder
              title="Motion studies"
              description="Updated yesterday"
              count={5}
              itemLabel="file"
              defaultOpen
              previews={FOLDER_PREVIEWS.slice(0, 2)}
            />
          </div>
          <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
            `previews` are fanned above the sleeve (five at most); the second folder starts with its
            flap open. Pressing either one opens the full-screen overlay — it is portaled to
            `document.body`, so it covers the viewport rather than this box, and it locks body
            scrolling while it is up. `count` / `itemLabel` are what the footer counts.
          </p>
        </div>
      </Demo>

      <Demo label="infinite-masonry" height={460}>
        <InfiniteMasonryDemo />
      </Demo>

      <p className="text-xs text-muted-foreground">
        The masonry owns its scroller (the box scrolls, not the page) and windows the items with a
        virtualizer, so it needs a height from `className`. `onLoadMore` fires `prefetch` items
        before the end — the demo pages a local counter and shows the built-in loading tail. `hasMore`
        false swaps in `endState`, and empty items with no more pages show `emptyState`.
      </p>

      <Demo label="cylinder-carousel" height={420}>
        <CylinderCarousel height={420} itemSize={180} visibleItems={5}>
          {CAROUSEL_FACES.map((face) => (
            <div
              key={face}
              className="flex size-full items-center justify-center rounded-full border border-border bg-card text-2xl font-medium tabular-nums text-foreground"
            >
              {face}
            </div>
          ))}
        </CylinderCarousel>
      </Demo>

      <p className="text-xs text-muted-foreground">
        Drag it, flick it, or arrow-key it — the balls wrap around and settle on the nearest one.
        `variant=&quot;convex&quot;` bulges the center outward instead of inward, `minScale` sets how
        small the edge balls get, `autoRotate` makes it roll on its own, and `defaultIndex` /
        `onIndexChange` give you the resting index. Wheel over the stage rolls the cylinder and still
        scrolls the page.
      </p>
    </Section>
  )
}
