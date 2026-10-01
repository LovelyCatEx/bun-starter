import { AvailabilityScheduler } from '@/components/motion/availability-scheduler'
import { NotFoundGlitch } from '@/components/motion/not-found/glitch'
import { NotFoundMagnetic } from '@/components/motion/not-found/magnetic'
import { NotFoundSpotlight } from '@/components/motion/not-found/spotlight'
import { NotFoundStacked } from '@/components/motion/not-found/stacked'
import { NotFoundTerminal } from '@/components/motion/not-found/terminal'
import { PredictionMarket } from '@/components/motion/prediction-market'
import { PredictionMarketCard } from '@/components/motion/prediction-market-card'
import { MultiChainSwap } from '@/components/motion/swap'
import { WalletCard } from '@/components/motion/wallet-card'
import { Demo, Section } from '@/pages/debug/components/section'

/**
 * The "whole product" pieces: a wallet, a swap, two prediction-market surfaces, a weekly
 * availability editor, and the five 404 stages. English on purpose — see `.claude/rules/frontend.md`.
 */

const WALLET_ACCOUNTS = [
  {
    id: 'main',
    name: 'Main wallet',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
  {
    id: 'cold',
    name: 'Cold storage',
    address: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
  },
  {
    id: 'trading',
    name: 'Trading',
    address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
  },
]

const MARKET_OUTCOMES = [
  { id: 'yes', label: 'Yes', price: 0.62 },
  { id: 'no', label: 'No', price: 0.38 },
]

const FED_VOLUME = [18, 24, 21, 30, 28, 36, 33, 41]

const MATCH_VOLUME = [12, 19, 26, 22, 34, 47, 39, 52]

// 状态色走 `--success` / `--warning`（主胜绿、平局琥珀），不要用 `--chart-1..5` ——
// 理由见 `.claude/rules/frontend.md`「颜色只能用 token」。
const MATCH_OUTCOMES = [
  { id: 'arsenal', label: 'Arsenal', probability: 0.54, color: 'var(--success)' },
  { id: 'draw', label: 'Draw', probability: 0.24, color: 'var(--warning)' },
  { id: 'chelsea', label: 'Chelsea', probability: 0.22 },
]

const FED_OUTCOMES = [
  { id: 'yes', label: 'Yes, in December', probability: 0.62 },
  { id: 'no', label: 'No', probability: 0.38 },
]

export function DomainSection() {
  return (
    <Section
      title="Other & domain"
      description="Product-shaped components rather than primitives: a wallet overview, a cross-chain swap, two prediction-market views, a weekly availability editor and the five not-found stages. Every box below is a fixed-height stage — the component inside owns the layout."
    >
      <Demo label="swap" height={620}>
        <div className="h-full w-full overflow-y-auto p-4">
          <MultiChainSwap />
          <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
            One card, two sides: pick a chain and a token on each side, flip them, expand the
            destination row, and the quote re-runs with a short delay. `chains` and `tokens` default
            to the built-in list, `defaultFromId` / `defaultToId` set where it opens. The token picker
            is a bottom sheet absolutely positioned inside the card, so it slides up within this box
            instead of over the page.
          </p>
        </div>
      </Demo>

      <Demo label="wallet-card" height={460}>
        <div className="h-full w-full overflow-y-auto p-4">
          <div className="w-full max-w-xs">
            <WalletCard
              accounts={WALLET_ACCOUNTS}
              balance={12480.32}
              defaultChange={184.42}
              defaultBalanceHidden={false}
              searchPlaceholder="Search tokens, accounts, domains"
              searchRecent={['usdc', '0x71C7…976F', 'sol']}
              hasNotifications
            />
          </div>
          <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
            Three panels share one row: the account switcher morphs into a full-width list, the
            search icon into a search bar (the recent list is `searchRecent`), and the eye button
            masks the balance. Send / Deposit / Swap / Buy are callbacks only — `onSend` and friends
            are what the app wires up. Accounts without an `avatar` node fall back to a remote
            DiceBear image keyed on the account id, so they need the network.
          </p>
        </div>
      </Demo>

      <Demo label="prediction-market" height={620}>
        <div className="h-full w-full overflow-y-auto p-4">
          <PredictionMarket
            outcomes={MARKET_OUTCOMES}
            defaultValue={{ mode: 'buy', outcomeId: 'yes', amount: '25' }}
            balance={500}
            positions={{ yes: 24, no: 16 }}
            quickAmounts={[10, 50, 100, 500]}
            orderTypeLabel="Market"
          />
          <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
            The whole order ticket: Buy / Sell tabs, an outcome selector showing price and your
            position, an amount field with quick chips and a Max button, and a footer that prices the
            order — average price plus a payout ticker that counts up. The demo opens at 25 on the Yes
            side; `minTrade`, `balance` and `positions` are what the validation messages read, and the
            action button runs its own idle → Trading → Trade filled cycle, then hands `onTrade` the
            order and the computed quote. `authenticated={'{false}'}` swaps that action for Connect.
          </p>
        </div>
      </Demo>

      <Demo label="prediction-market-card" height={460}>
        <div className="flex h-full w-full flex-wrap items-start gap-4 overflow-y-auto p-4">
          <div className="w-full max-w-xs">
            <PredictionMarketCard
              title="Will the Fed cut rates in December?"
              category="Economics"
              status="Ends Dec 18"
              volume="$2.4M"
              volumeHistory={FED_VOLUME}
              outcomes={FED_OUTCOMES}
              defaultBookmarked
            />
          </div>
          <div className="w-full max-w-xs">
            <PredictionMarketCard
              title="Arsenal vs Chelsea — match winner"
              category="Sports"
              status="78'"
              live
              volume="$864K"
              volumeHistory={MATCH_VOLUME}
              outcomes={MATCH_OUTCOMES}
            />
          </div>
          <p className="w-full max-w-2xl text-xs text-muted-foreground">
            The listing view of the same market. Each outcome row carries a payout multiplier with a
            tooltip and a Yes / No CTA that swaps its label in on hover or focus; the row under it is
            the probability bar, tinted per outcome with `color`. The footer takes an optional
            sparkline from `volumeHistory`, and `defaultBookmarked` / `onBookmarkChange` drive the
            bookmark on the right. The card keeps no selection state — `onOutcomeClick` hands you
            `{'{'} outcomeId, side {'}'}`.
          </p>
        </div>
      </Demo>

      <Demo label="availability-scheduler" height={560}>
        <div className="h-full w-full overflow-y-auto p-4">
          <AvailabilityScheduler step={30} />
          <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
            A week of same-day ranges: toggle a day off, add or remove a range, and open either end
            for a time dropdown. Only one dropdown is open at a time by design — the rows below the
            fold can be reached by scrolling this box. `step` is the slot grid the dropdowns snap to
            (30 minutes here), `value` / `onChange` take the whole `WeekAvailability`, and the
            uncontrolled default is the `defaultWeek()` export: Mon–Fri 9–5, weekend off.
          </p>
        </div>
      </Demo>

      {/*
        `h-full min-h-0` drops `NotFoundStage`'s `min-h-[420px]` floor so the stage fills the
        bounded box instead of hanging past the bottom edge.
      */}
      <Demo label="not-found-glitch" height={360}>
        <NotFoundGlitch className="h-full min-h-0" />
      </Demo>

      <Demo label="not-found-magnetic" height={360}>
        <NotFoundMagnetic className="h-full min-h-0" />
      </Demo>

      <Demo label="not-found-spotlight" height={360}>
        <NotFoundSpotlight className="h-full min-h-0" />
      </Demo>

      <Demo label="not-found-stacked" height={360}>
        <NotFoundStacked className="h-full min-h-0" />
      </Demo>

      <Demo label="not-found-terminal" height={360}>
        <NotFoundTerminal className="h-full min-h-0" />
      </Demo>

      <p className="max-w-3xl text-xs text-muted-foreground">
        All five take the same props — `code`, `title`, `description`, `homeHref` / `homeLabel` and
        `browseHref` / `browseLabel` — and fall back to `NOT_FOUND_DEFAULTS` (404, "Page not found",
        a home CTA and a browse CTA) when you pass nothing. What changes is the stage: glitch splits
        the code into chromatic ghosts that slide apart on hover, magnetic pulls the glyphs toward
        the pointer, spotlight reveals the code through a masked light that follows the cursor,
        stacked spreads two cards out from behind the top one on hover, and terminal types the code
        out line by line in a shell window with a blinking cursor. Each one is meant to be a route, so
        they render a full-page-ish stage rather than a small widget. Spotlight is the tallest of the
        five — a 16/9 panel up to `max-w-xl` plus its CTAs needs more than 360px, so it crowds this
        box; give that one a taller `Demo` if you want the buttons fully in frame.
      </p>
    </Section>
  )
}
