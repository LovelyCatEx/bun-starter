import { useState } from 'react'

import { AnimatedBadge, type AnimatedBadgeStatus } from '@/components/motion/animated-badge'
import { AnimatedNumber } from '@/components/motion/animated-number'
import { Button } from '@/components/motion/button'
import { ChromaticTextReveal } from '@/components/motion/chromatic-text-reveal'
import { DigitSwap, type DigitSwapDirection } from '@/components/motion/digit-swap'
import { Marquee } from '@/components/motion/marquee'
import { NumberTicker } from '@/components/motion/number-ticker'
import { TextCascade } from '@/components/motion/text-cascade'
import { TextReveal } from '@/components/motion/text-reveal'
import { TextScramble } from '@/components/motion/text-scramble'
import { TextShimmer } from '@/components/motion/text-shimmer'
import { Demo, Section } from '@/pages/debug/components/section'

/**
 * English and hard-coded on purpose — the debug page is exempt from the i18n rules
 * (see `.claude/rules/frontend.md`).
 */

const CASCADE_STEPS = ['Uploading…', 'Encrypting…', 'Published'] as const

const SCRAMBLE_STEPS = ['DECRYPTING PAYLOAD', 'VERIFYING CHECKSUM', 'ACCESS GRANTED'] as const

const BADGE_STATUSES: AnimatedBadgeStatus[] = [
  'neutral',
  'info',
  'success',
  'warning',
  'danger',
  'loading',
]

const BADGE_LABEL: Record<AnimatedBadgeStatus, string> = {
  neutral: 'Idle',
  info: 'Queued',
  success: 'Deployed',
  warning: 'Degraded',
  danger: 'Failed',
  loading: 'Building',
}

const MARQUEE_ITEMS = [
  'text-reveal',
  'text-cascade',
  'text-scramble',
  'text-shimmer',
  'chromatic-text-reveal',
  'animated-number',
  'number-ticker',
  'animated-badge',
  'digit-swap',
  'marquee',
]

const MARQUEE_AXES = ['up', 'down', 'left', 'right']

export function TextSection() {
  // These three have no "replay" prop — a remount key is the only way to replay them.
  const [revealRun, setRevealRun] = useState(0)
  const [amountRun, setAmountRun] = useState(0)
  const [usageRun, setUsageRun] = useState(0)

  const [cascadeStep, setCascadeStep] = useState(0)
  const [scrambleStep, setScrambleStep] = useState(0)

  const [amount, setAmount] = useState(1284)
  const [ticker, setTicker] = useState(48250)

  const [badgeIndex, setBadgeIndex] = useState(2)
  const [badgeRoll, setBadgeRoll] = useState(0)

  const [usage, setUsage] = useState(684)
  const [usageDirection, setUsageDirection] = useState<DigitSwapDirection>('up')

  const badgeStatus = BADGE_STATUSES[badgeIndex]

  return (
    <Section
      title="Text & numbers"
      description="Ten string-and-value animations: reveals, cascades, scrambles, shimmer, tickers and badges. Each demo owns the state that turns it on — click the buttons, they are the demo."
    >
      <Demo label="text-reveal">
        <div className="flex w-full flex-col gap-4">
          <TextReveal
            key={`reveal-words-${revealRun}`}
            text={['Every word drops in,', 'staggered left to right.']}
            split="word"
            className="max-w-lg text-xl font-medium"
          />
          <TextReveal
            key={`reveal-chars-${revealRun}`}
            text="split=char animates each character inside its own word box."
            split="char"
            stagger={0.028}
            blur={8}
            className="max-w-lg text-sm text-muted-foreground"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setRevealRun((run) => run + 1)}>
              Replay
            </Button>
          </div>
          <p className="max-w-2xl text-xs text-muted-foreground">
            It plays on mount, because `whileInView` is off by default — so Replay bumps a key
            and remounts. Pass `whileInView` and it waits for the viewport instead (and `once={false}`
            makes it replay on every entry). `text` takes a string or an array of lines; `blur`,
            `stagger`, `yOffset` and `spring` shape the motion.
          </p>
        </div>
      </Demo>

      <Demo label="text-cascade">
        <div className="flex w-full flex-col gap-4">
          <TextCascade text={CASCADE_STEPS[cascadeStep]} className="text-2xl font-semibold" />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCascadeStep((step) => (step + 1) % CASCADE_STEPS.length)}
            >
              Next text
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCascadeStep(0)}>
              Back to the first
            </Button>
          </div>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Letters roll slot-machine style whenever `text` changes. The first render does not
            animate — the component only cascades on a change, so there is nothing to see until
            you click.
          </p>
        </div>
      </Demo>

      <Demo label="text-scramble">
        <div className="flex w-full flex-col gap-4">
          <TextScramble
            text={SCRAMBLE_STEPS[scrambleStep]}
            className="font-mono text-xl font-medium tracking-wide"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setScrambleStep((step) => (step + 1) % SCRAMBLE_STEPS.length)}
            >
              Next text
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setScrambleStep(0)}>
              Back to the first
            </Button>
          </div>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Unresolved positions sample from `glyphs` and settle left to right; `duration` caps
            the run (default scales with the text length). The real string stays in an `sr-only`
            span, and reduced motion skips the scramble entirely.
          </p>
        </div>
      </Demo>

      <Demo label="text-shimmer">
        <div className="flex w-full flex-col gap-3">
          <TextShimmer as="h3" className="text-2xl font-semibold">
            Shimmering heading
          </TextShimmer>
          <TextShimmer duration={5} className="max-w-md text-sm">
            A slower sweep for body copy — duration is the only knob, plus `as` for the element.
          </TextShimmer>
        </div>
      </Demo>

      <Demo label="chromatic-text-reveal">
        <div className="flex w-full flex-col gap-3">
          <ChromaticTextReveal
            prefix="Built for"
            words={['speed', 'clarity', 'scale']}
            className="text-2xl font-semibold"
          />
          <p className="max-w-2xl text-xs text-muted-foreground">
            The final word sweeps in behind a moving chromatic edge, rests for `pauseDuration`,
            then the next one takes its place — it loops forever and holds its own width (the
            longest word reserves the slot). It starts when it scrolls into view; `colors`,
            `foregroundColor` and `duration` restyle the sweep.
          </p>
        </div>
      </Demo>

      <Demo label="animated-number">
        <div className="flex w-full flex-col gap-4">
          <AnimatedNumber
            key={`amount-${amountRun}`}
            value={amount}
            className="text-3xl font-semibold"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setAmount((value) => value + 2500)}>
              +2,500
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAmount(Math.round(Math.random() * 90000) + 1000)}
            >
              Randomize
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAmount(0)}>
              Drop to 0
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAmountRun((run) => run + 1)}>
              Count up from 0 again
            </Button>
          </div>
          <p className="max-w-2xl text-xs text-muted-foreground">
            It eases from whatever it showed last to the new value, so the buttons above each
            animate the gap. `startOnView` (on by default) only delays the *first* count — it
            waits until the number has been seen. Remounting is what replays it from zero.
          </p>
        </div>
      </Demo>

      <Demo label="number-ticker">
        <div className="flex w-full flex-col gap-4">
          <NumberTicker value={ticker} prefix="$" locale className="text-3xl font-semibold" />
          <NumberTicker
            value={ticker}
            pad={6}
            blur
            suffix=" pts"
            className="text-lg text-muted-foreground"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setTicker((value) => value + 1375)}>
              +1,375
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTicker(Math.round(Math.random() * 999999))}
            >
              Randomize
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTicker(0)}>
              Reset to 0
            </Button>
          </div>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Unlike animated-number, each digit occupies a fixed slot and rolls to its new value —
            digits are keyed by place value, so adding a thousands digit grows the number on the
            left without re-rolling the digits already on screen. `blur` softens the roll, `pad`
            zero-fills, `locale` inserts separators.
          </p>
        </div>
      </Demo>

      <Demo label="animated-badge">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {BADGE_STATUSES.map((status) => (
              <AnimatedBadge key={status} status={status} size="md">
                {BADGE_LABEL[status]}
              </AnimatedBadge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AnimatedBadge status={badgeStatus} size="sm">
              {BADGE_LABEL[badgeStatus]}
            </AnimatedBadge>
            <AnimatedBadge status="success" size="sm" pulse={false}>
              No pulse
            </AnimatedBadge>
            <AnimatedBadge status="info" size="sm" showIcon={false}>
              Icon off
            </AnimatedBadge>
            <AnimatedBadge
              status="success"
              size="sm"
              contentKey={`roll-${badgeRoll}`}
              pulse={false}
            >
              Synced
            </AnimatedBadge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBadgeIndex((index) => (index + 1) % BADGE_STATUSES.length)}
            >
              Next status
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setBadgeRoll((roll) => roll + 1)}>
              Re-roll the unchanged label
            </Button>
          </div>

          <p className="max-w-2xl text-xs text-muted-foreground">
            Status swaps the icon, the tone and the label together; `loading` also pulses by
            default. The label usually re-rolls because its text changed — the last badge shows
            the escape hatch: keep the text and change `contentKey` to roll the same string again.
          </p>
        </div>
      </Demo>

      <Demo label="digit-swap">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <DigitSwap
              value={`${usage}MB`}
              direction={usageDirection}
              suffixLength={2}
              suffixClassName="text-sm text-muted-foreground"
              className="font-mono text-3xl font-semibold"
            />
            <Button size="sm" variant="outline" onClick={() => setUsage((mb) => mb + 128)}>
              +128 MB
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUsage((mb) => Math.max(0, mb - 128))}
            >
              -128 MB
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setUsageDirection((direction) => (direction === 'up' ? 'down' : 'up'))
              }
            >
              Direction: {usageDirection}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DigitSwap
              value="4,096 / 8,192"
              animationKey={usageRun}
              className="font-mono text-sm text-muted-foreground"
            />
            <Button size="sm" variant="outline" onClick={() => setUsageRun((run) => run + 1)}>
              Replay unchanged line
            </Button>
          </div>

          <p className="max-w-2xl text-xs text-muted-foreground">
            Every character keeps a fixed `1ch` slot and rolls only when its own value changes —
            which is why the mask line needs `animationKey`: with the value untouched, nothing
            would move. `suffixLength` hands the last N characters to `suffixClassName`, used
            here to shrink the unit.
          </p>
        </div>
      </Demo>

      <Demo label="marquee">
        <div className="flex w-full flex-col gap-6">
          <Marquee speed={26} gap="0.75rem" className="w-full py-1">
            {MARQUEE_ITEMS.map((item) => (
              <span
                key={item}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </Marquee>

          <div className="flex flex-wrap items-start gap-6">
            <Marquee
              direction="right"
              speed={34}
              gap="2rem"
              fade={false}
              className="min-w-56 flex-1 py-1 text-sm text-muted-foreground"
            >
              <span>{'direction="right"'}</span>
              <span>{'fade={false} shows the hard seam'}</span>
              <span>hover pauses it</span>
            </Marquee>

            <Marquee
              direction="up"
              speed={14}
              gap="0.5rem"
              className="h-28 w-40 rounded-lg border border-border p-3 text-xs text-muted-foreground"
            >
              {MARQUEE_AXES.map((axis) => (
                <span key={axis}>{axis}</span>
              ))}
            </Marquee>
          </div>

          <p className="max-w-2xl text-xs text-muted-foreground">
            The children are duplicated into two tracks and translated as a pair, so the loop has
            no seam; `speed` is seconds for one pass, `gap` also pads the wrapper so the two
            tracks meet at the same spacing. `pauseOnHover` is on unless you turn it off, and the
            edges are masked unless `fade={false}`.
          </p>
        </div>
      </Demo>
    </Section>
  )
}
