import {
  Archive,
  Bell,
  Bold,
  Check,
  Copy,
  Italic,
  Link,
  Palette,
  Pencil,
  Plus,
  Share2,
  Star,
  Trash2,
  Underline,
  Undo2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { ActionSwapButton, ActionSwapIcon, ActionSwapText } from '@/components/motion/action-swap'
import { ActionSwapBlurButton } from '@/components/motion/action-swap-blur'
import { ActionSwapCascadeButton } from '@/components/motion/action-swap-cascade'
import { ActionSwapRollButton } from '@/components/motion/action-swap-roll'
import {
  AdaptiveStepper,
  AdaptiveStepperDecrement,
  AdaptiveStepperIncrement,
  AdaptiveStepperValue,
} from '@/components/motion/adaptive-stepper'
import { BloomMenu } from '@/components/motion/bloom-menu'
import {
  Button,
  ButtonLink,
  MagneticButton,
  MetallicButton,
  StatefulButton,
  type ButtonState,
} from '@/components/motion/button'
import {
  ExpandableActionBar,
  type ExpandableActionBarItem,
  useExpandableActionBar,
} from '@/components/motion/expandable-action-bar'
import { ExpandableButton, ExpandableChip } from '@/components/motion/expandable-control'
import { ExpandingArrowButton } from '@/components/motion/expanding-arrow-button'
import { HoldActionButton } from '@/components/motion/hold-action-button'
import { Liquid, LiquidItem } from '@/components/motion/liquid'
import { Magnetic } from '@/components/motion/magnetic'
import { OverflowActions, type OverflowActionItem } from '@/components/motion/overflow-actions'
import { SlideActionButton } from '@/components/motion/slide-action-button'
import { Demo, Section } from '@/pages/debug/components/section'

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'outline'] as const
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const

/**
 * Labels are plain strings on purpose: the cascade animation splits the label per letter.
 */
const SWAP_STATES = [
  { id: 'draft', label: 'Draft', icon: <Pencil className="size-4" /> },
  { id: 'review', label: 'In review', icon: <Star className="size-4" /> },
  { id: 'shipped', label: 'Shipped', icon: <Check className="size-4" /> },
]

const OVERFLOW_PRIMARY: OverflowActionItem[] = [
  { id: 'copy', label: 'Copy', icon: <Copy className="size-4" /> },
  { id: 'share', label: 'Share', icon: <Share2 className="size-4" /> },
]

const OVERFLOW_MORE: OverflowActionItem[] = [
  { id: 'star', label: 'Star', icon: <Star className="size-4" /> },
  { id: 'archive', label: 'Archive', icon: <Archive className="size-4" /> },
  { id: 'delete', label: 'Delete', icon: <Trash2 className="size-4" />, disabled: true },
]

const ACTION_BAR_ITEMS: ExpandableActionBarItem[] = [
  { id: 'undo', label: 'Undo', icon: <Undo2 className="size-4" />, shortcut: '⌘Z' },
  { id: 'style', label: 'Style', icon: <Palette className="size-4" />, shortcut: 'S' },
  { id: 'bold', label: 'Bold', icon: <Bold className="size-4" />, shortcut: '⌘B' },
  { id: 'italic', label: 'Italic', icon: <Italic className="size-4" />, shortcut: '⌘I' },
  { id: 'underline', label: 'Underline', icon: <Underline className="size-4" />, shortcut: '⌘U' },
  { id: 'link', label: 'Link', icon: <Link className="size-4" />, badge: '3' },
]

const SEGMENTS = ['Inbox', 'Archive', 'Trash']
const SEGMENT_WIDTH = 104
const SEGMENT_STRIDE = 108
const SEGMENT_INSET = 4

/**
 * Every button-ish component under `web/src/components/motion/`, on our tokens; each demo that
 * owns state wires a real handler. English on purpose — see `.claude/rules/frontend.md`.
 */
export function ButtonsSection() {
  // `useExpandableActionBar` owns the bar's state, so the controlled path is
  // exercised without this file needing its own useState for it.
  const actionBar = useExpandableActionBar(ACTION_BAR_ITEMS)
  const [lastEvent, setLastEvent] = useState('nothing yet')
  const [submitState, setSubmitState] = useState<ButtonState>('idle')
  const [swapStep, setSwapStep] = useState(0)
  const [segment, setSegment] = useState(0)
  const [quantity, setQuantity] = useState(3)

  // The stateful button walks itself through loading → success → idle, so a
  // single click shows the whole cycle. The frozen states are rendered below.
  useEffect(() => {
    if (submitState === 'idle') return
    const timer = setTimeout(
      () => setSubmitState(submitState === 'loading' ? 'success' : 'idle'),
      submitState === 'loading' ? 1400 : 1600,
    )
    return () => clearTimeout(timer)
  }, [submitState])

  const swapItem = SWAP_STATES[swapStep % SWAP_STATES.length]

  return (
    <Section
      title="Buttons & actions"
      description="Base buttons, press-and-hold / slide-to-confirm gestures, the action-swap family, and the menus and bars built out of them. Anything that animates on its own reports what it did into the readout at the bottom."
    >
      <Demo label="button-base">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_SIZES.map((size) => (
              <Button key={size} size={size} variant="outline">
                size {size}
              </Button>
            ))}
            <Button size="icon" variant="outline" aria-label="Icon button">
              <Plus className="size-4" />
            </Button>
            <Button
              variant="secondary"
              ripple
              onClick={() => setLastEvent('button-base: clicked (ripple)')}
            >
              Ripple — click me
            </Button>
            <ButtonLink href="#button-base" variant="ghost">
              ButtonLink
            </ButtonLink>
          </div>
        </div>
      </Demo>

      <Demo label="button-magnetic">
        <MagneticButton
          strength={0.3}
          onClick={() => setLastEvent('button-magnetic: clicked')}
        >
          Pull 0.3
        </MagneticButton>
        <MagneticButton strength={0.6} variant="secondary">
          Pull 0.6
        </MagneticButton>
      </Demo>

      <Demo label="button-metallic">
        <MetallicButton onClick={() => setLastEvent('button-metallic: clicked')}>
          Metallic
        </MetallicButton>
        <MetallicButton size="lg">Large</MetallicButton>
        <MetallicButton paused>Paused reflection</MetallicButton>
        <MetallicButton size="icon" aria-label="Metallic icon">
          <Star className="size-4" />
        </MetallicButton>
      </Demo>

      <Demo label="button-stateful">
        <StatefulButton
          state={submitState}
          icon={<Plus className="size-4" />}
          loadingText="Saving"
          successText="Saved"
          errorText="Retry"
          onClick={() => setSubmitState('loading')}
        >
          Save
        </StatefulButton>
        <StatefulButton state="loading">Save</StatefulButton>
        <StatefulButton state="success">Save</StatefulButton>
        <StatefulButton state="error">Save</StatefulButton>
      </Demo>

      <Demo label="hold-action-button">
        <HoldActionButton onHoldComplete={() => setLastEvent('hold-action-button: held to the end')}>
          Hold to delete
        </HoldActionButton>
        <HoldActionButton
          type="horizontal"
          holdDuration={1000}
          holdingLabel="Almost there"
          completeLabel="Deleted"
          onHoldComplete={() => setLastEvent('hold-action-button: horizontal hold completed')}
        >
          Hold (horizontal)
        </HoldActionButton>
      </Demo>

      <Demo label="slide-action-button">
        <SlideActionButton onComplete={() => setLastEvent('slide-action-button: confirmed')}>
          Slide to confirm
        </SlideActionButton>
        <SlideActionButton
          completeLabel="Sent"
          resetDelay={800}
          onComplete={() => setLastEvent('slide-action-button: sent')}
        >
          Slide to send
        </SlideActionButton>
      </Demo>

      <Demo label="expanding-arrow-button">
        <ExpandingArrowButton
          onClick={() => setLastEvent('expanding-arrow-button: clicked')}
        >
          Hover or focus me
        </ExpandingArrowButton>
        <ExpandingArrowButton disabled>Disabled</ExpandingArrowButton>
      </Demo>

      <Demo label="action-swap">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {(['blur', 'roll', 'cascade'] as const).map((animation) => (
              <ActionSwapButton
                key={animation}
                items={SWAP_STATES}
                animation={animation}
                onValueChange={(value) => setLastEvent(`action-swap (${animation}): ${value}`)}
              />
            ))}
            <ActionSwapButton items={SWAP_STATES} variant="primary" />
            <ActionSwapButton items={SWAP_STATES} size="icon" variant="outline" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/*
              The pair a swap button is made of, driven from outside: `value` is the animation
              key, so the text has to be a string for cascade to split it.
            */}
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <ActionSwapIcon value={swapItem.id} animation="blur" className="size-4">
                {swapItem.icon}
              </ActionSwapIcon>
              <ActionSwapText value={swapItem.id} animation="cascade">
                {swapItem.label}
              </ActionSwapText>
            </span>
            <Button size="sm" variant="outline" onClick={() => setSwapStep((step) => step + 1)}>
              Advance label
            </Button>
          </div>
        </div>
      </Demo>

      <Demo label="action-swap-blur">
        <ActionSwapBlurButton
          items={SWAP_STATES}
          onValueChange={(value) => setLastEvent(`action-swap-blur: ${value}`)}
        />
        <ActionSwapBlurButton items={SWAP_STATES} variant="primary" size="lg" />
      </Demo>

      <Demo label="action-swap-cascade">
        <ActionSwapCascadeButton
          items={SWAP_STATES}
          onValueChange={(value) => setLastEvent(`action-swap-cascade: ${value}`)}
        />
        <ActionSwapCascadeButton items={SWAP_STATES} variant="ghost" />
      </Demo>

      <Demo label="action-swap-roll">
        <ActionSwapRollButton
          items={SWAP_STATES}
          onValueChange={(value) => setLastEvent(`action-swap-roll: ${value}`)}
        />
        <ActionSwapRollButton items={SWAP_STATES} variant="outline" size="sm" />
      </Demo>

      {/* Fixed height: the panel opens out of the trigger in every direction and
          would otherwise overlap the sections below it. */}
      <Demo label="bloom-menu" height={360}>
        <div className="flex size-full items-center justify-center">
          <BloomMenu onSelect={(label) => setLastEvent(`bloom-menu: ${label}`)} />
        </div>
      </Demo>

      <Demo label="overflow-actions">
        <OverflowActions
          primaryActions={OVERFLOW_PRIMARY}
          overflowActions={OVERFLOW_MORE}
          onAction={(item) => setLastEvent(`overflow-actions: ${String(item.label)}`)}
        />
        <OverflowActions
          size="sm"
          defaultExpanded
          collapseOnAction
          primaryActions={OVERFLOW_PRIMARY}
          overflowActions={OVERFLOW_MORE}
          onAction={(item) => setLastEvent(`overflow-actions (open): ${String(item.label)}`)}
        />
      </Demo>

      <Demo label="expandable-action-bar">
        <div className="flex flex-col gap-2">
          <ExpandableActionBar
            items={ACTION_BAR_ITEMS}
            expanded={actionBar.expanded}
            onExpandedChange={actionBar.setExpanded}
            activeId={actionBar.activeId}
            onAction={(item) => {
              actionBar.setActiveId(item.id)
              setLastEvent(`expandable-action-bar: ${item.id}`)
            }}
          />
          <span className="text-xs text-muted-foreground">
            Active: {actionBar.activeItem?.id ?? 'none'} — labels slide in on hover or focus,
            and the bar is driven through `useExpandableActionBar()`.
          </span>
        </div>
      </Demo>

      <Demo label="expandable-control">
        <ExpandableButton icon={<Plus className="size-4" />} label="New file" />
        <ExpandableButton icon={<Bell className="size-4" />} label="Notify me" defaultExpanded />
        <ExpandableChip
          label="Filters"
          actionIcon={<X className="size-3.5" />}
          actionLabel="Clear filters"
          onAction={() => setLastEvent('expandable-control: chip action')}
        />
      </Demo>

      <Demo label="magnetic">
        <Magnetic strength={0.4}>
          <div className="rounded-2xl border border-border bg-card px-6 py-4 text-sm font-medium text-foreground">
            Move the cursor over me
          </div>
        </Magnetic>
        <Magnetic strength={0.8}>
          <div className="grid size-16 place-items-center rounded-full border border-border bg-card">
            <Star className="size-5" />
          </div>
        </Magnetic>
      </Demo>

      <Demo label="liquid">
        <div className="flex flex-col gap-2">
          {/*
            `LiquidItem` is the gooey pill (the SVG filter draws it, the div under it is the
            hit surface); the labels sit above it as ordinary buttons.
          */}
          <Liquid
            fill="var(--primary)"
            className="h-11 w-[20.5rem] rounded-full border border-border bg-muted/40"
          >
            <LiquidItem
              x={segment * SEGMENT_STRIDE + SEGMENT_INSET}
              y={SEGMENT_INSET}
              width={SEGMENT_WIDTH}
              height={36}
              radius={18}
            >
              <span aria-hidden="true" className="block size-full rounded-full" />
            </LiquidItem>
            {SEGMENTS.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => setSegment(index)}
                style={{ left: index * SEGMENT_STRIDE + SEGMENT_INSET, width: SEGMENT_WIDTH }}
                className={`absolute inset-y-1 z-20 rounded-full text-sm font-medium transition-colors ${
                  segment === index
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item}
              </button>
            ))}
          </Liquid>
          <span className="text-xs text-muted-foreground">
            The pill is a filter-generated shape: it stretches between slots instead of sliding,
            which is the whole point of the gooey edge.
          </span>
        </div>
      </Demo>

      <Demo label="adaptive-stepper">
        <div className="flex flex-wrap items-center gap-4">
          <AdaptiveStepper
            value={quantity}
            onValueChange={setQuantity}
            min={0}
            max={8}
            formatValueText={(value) => `${value} pieces`}
          >
            <AdaptiveStepperDecrement />
            <AdaptiveStepperValue>{(value) => `${value} pcs`}</AdaptiveStepperValue>
            <AdaptiveStepperIncrement />
          </AdaptiveStepper>
          <span className="text-sm text-muted-foreground tabular-nums">
            value = {quantity}
          </span>
        </div>
      </Demo>

      <p className="text-xs text-muted-foreground">
        Last event: <span className="font-medium text-foreground">{lastEvent}</span>
      </p>
    </Section>
  )
}
