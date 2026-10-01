import { BumpChart } from '@/components/charts/bump-chart'
import { CompositionChart } from '@/components/charts/composition-chart'
import { FunnelChart } from '@/components/charts/funnel-chart'
import { HeatCalendar } from '@/components/charts/heat-calendar'
import { LiquidityHeatmap } from '@/components/charts/liquidity-heatmap'
import { OrderBook } from '@/components/charts/order-book'
import { PriceTargetFan, type PriceTarget } from '@/components/charts/price-target-fan'
import { ReturnsCalendar } from '@/components/charts/returns-calendar'
import {
  KnockoutBracket,
  ROUNDS as BRACKET_ROUNDS,
  THIRD_PLACE,
} from '@/components/motion/knockout-bracket'
import { KnockoutWheel, ROUNDS as WHEEL_ROUNDS } from '@/components/motion/knockout-wheel'

import { Demo, Section } from '@/pages/debug/components/section'

/*
 * beUI 的图表调色板是写死的 hex，这里改成语义 token，四档暗色才跟着走：`--chart-1..5` 在
 * `dark.css` 里没有翻转（深黑下第五档几乎看不见），`--accent` 在亮色是近白、做不了线色。
 * 下面这几个在亮 / 暗两边都成立。
 */
const SERIES_COLORS = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
}

/* ── bump-chart ────────────────────────────────────────────────────────────
 * `series[].ranks` 每个周期一个名次（从 1 开始，`null` 让路径断开），长度要跟 `periods` 对齐。
 * 不传 `color` 就用库自带的 BUMP_COLORS。名次跨度决定图高：(maxRank - 1) × 44 + 64。
 */

const BUMP_PERIODS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

const BUMP_SERIES = [
  { id: 'aurora', name: 'Aurora', ranks: [3, 2, 2, 1, 1, 1], color: SERIES_COLORS.primary },
  { id: 'borealis', name: 'Borealis', ranks: [1, 1, 3, 2, 3, 2], color: SERIES_COLORS.success },
  { id: 'cascade', name: 'Cascade', ranks: [2, 3, 1, 3, 2, 3], color: SERIES_COLORS.warning },
  { id: 'delta', name: 'Delta', ranks: [4, 4, 5, 4, 4, 5], color: SERIES_COLORS.destructive },
  { id: 'everest', name: 'Everest', ranks: [5, 5, 4, 5, 5, 4], color: 'var(--muted-foreground)' },
]

/* ── composition-chart ─────────────────────────────────────────────────────
 * `series[].values` 按周期对齐，每个周期归一化成 100%；`color` 是必填项。
 * `view` 默认 'bar'，传 'area' 换成堆叠面积。
 */

const COMPOSITION_PERIODS = ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24', 'Q1 25', 'Q2 25']

const COMPOSITION_SERIES = [
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    color: SERIES_COLORS.primary,
    values: [42, 46, 51, 57, 62, 68],
  },
  { id: 'usage', name: 'Usage', color: SERIES_COLORS.success, values: [18, 21, 20, 26, 31, 35] },
  { id: 'services', name: 'Services', color: SERIES_COLORS.warning, values: [12, 11, 14, 13, 15, 14] },
  {
    id: 'licensing',
    name: 'Licensing',
    color: SERIES_COLORS.destructive,
    values: [9, 8, 7, 6, 5, 4],
  },
]

/* ── funnel-chart ──────────────────────────────────────────────────────────
 * `stages` 按顺序给 label + value 就行，颜色不传按内置五档分配。
 * 子件（FunnelChartPlot / FunnelChartSummary）不传 children 时自动拼好。
 */

const FUNNEL_STAGES = [
  { id: 'visit', label: 'Visited', value: 48200 },
  { id: 'signup', label: 'Signed up', value: 18400 },
  { id: 'activate', label: 'Activated', value: 9860 },
  { id: 'subscribe', label: 'Subscribed', value: 4120 },
  { id: 'renew', label: 'Renewed', value: 2640 },
]

/* ── liquidity-heatmap ─────────────────────────────────────────────────────
 * `snapshots` 按时间排列，每列一张 `levels`（价格 → 挂单量），价格桶要一致。`price` 必须
 * 落在价格桶区间内，否则 pricePosition 判 null、轨迹断开。`maxSize` 是固定色阶上限。
 */

const LIQUIDITY_SNAPSHOTS = [
  {
    id: '2026-09-28T09:00:00Z',
    label: '09:00',
    price: 66980,
    levels: [
      { price: 67400, size: 12.4 },
      { price: 67200, size: 31.8 },
      { price: 67000, size: 58.2 },
      { price: 66800, size: 44.6 },
      { price: 66600, size: 19.3 },
    ],
  },
  {
    id: '2026-09-28T10:00:00Z',
    label: '10:00',
    price: 67055,
    levels: [
      { price: 67400, size: 14.1 },
      { price: 67200, size: 28.4 },
      { price: 67000, size: 66.0 },
      { price: 66800, size: 39.2 },
      { price: 66600, size: 17.8 },
    ],
  },
  {
    id: '2026-09-28T11:00:00Z',
    label: '11:00',
    price: 67140,
    levels: [
      { price: 67400, size: 18.6 },
      { price: 67200, size: 25.3 },
      { price: 67000, size: 71.5 },
      { price: 66800, size: 35.4 },
      { price: 66600, size: 16.2 },
    ],
  },
  {
    id: '2026-09-28T12:00:00Z',
    label: '12:00',
    price: 67205,
    levels: [
      { price: 67400, size: 22.9 },
      { price: 67200, size: 23.8 },
      { price: 67000, size: 64.7 },
      { price: 66800, size: 32.1 },
      { price: 66600, size: 14.9 },
    ],
  },
  {
    id: '2026-09-28T13:00:00Z',
    label: '13:00',
    price: 67010,
    levels: [
      { price: 67400, size: 26.4 },
      { price: 67200, size: 30.6 },
      { price: 67000, size: 59.3 },
      { price: 66800, size: 38.8 },
      { price: 66600, size: 18.4 },
    ],
  },
  {
    id: '2026-09-28T14:00:00Z',
    label: '14:00',
    price: 66940,
    levels: [
      { price: 67400, size: 24.1 },
      { price: 67200, size: 35.9 },
      { price: 67000, size: 52.8 },
      { price: 66800, size: 46.3 },
      { price: 66600, size: 23.7 },
    ],
  },
]

/* ── price-target-fan ──────────────────────────────────────────────────────
 * `targets` 是三元组（高 / 均 / 低），正好三个、key 唯一。`history` 的日期要严格递增且是
 * ISO（乱序会抛 RangeError）。不传 color 库按 accent 上色，而它在亮色是近白，故此处显式指定。
 */

const PRICE_HISTORY = [
  { date: '2025-10-01', price: 150.2 },
  { date: '2025-11-01', price: 158.4 },
  { date: '2025-12-01', price: 152.1 },
  { date: '2026-01-01', price: 166.8 },
  { date: '2026-02-01', price: 173.5 },
  { date: '2026-03-01', price: 169.2 },
  { date: '2026-04-01', price: 181.6 },
  { date: '2026-05-01', price: 190.3 },
  { date: '2026-06-01', price: 186.4 },
  { date: '2026-07-01', price: 198.7 },
  { date: '2026-08-01', price: 206.1 },
  { date: '2026-09-01', price: 214.5 },
]

const PRICE_TARGETS: [PriceTarget, PriceTarget, PriceTarget] = [
  { key: 'High', price: 268, analysts: 4, color: SERIES_COLORS.success },
  { key: 'Mean', price: 236.5, analysts: 18, color: SERIES_COLORS.primary },
  { key: 'Low', price: 188, analysts: 3, color: SERIES_COLORS.warning },
]

/* ── order-book ────────────────────────────────────────────────────────────
 * `bids` / `asks` 是两边最近的档位（不用自己排序、也不用累加，模型会做），
 * `levels` 是每边显示几档。`lastPrice` 省略时价差行显示最优买卖的中点。
 */

const BOOK_BIDS = [
  { price: 68011, size: 0.75 },
  { price: 68008.5, size: 1.2 },
  { price: 68004, size: 0.55 },
  { price: 67999.5, size: 1.85 },
  { price: 67994, size: 2.4 },
  { price: 67988.5, size: 0.9 },
]

const BOOK_ASKS = [
  { price: 68015.5, size: 0.42 },
  { price: 68018, size: 0.88 },
  { price: 68022.5, size: 1.35 },
  { price: 68026, size: 0.64 },
  { price: 68031.5, size: 2.1 },
  { price: 68038, size: 1.02 },
]

/* ── heat-calendar ─────────────────────────────────────────────────────────
 * `values[week][day]` 是 0..1 的强度（每周七格，周一打头），格子上的数 = 强度 × `maxCount`。
 * 给了 `endDate` 就是确定性的：不给的话首帧是空的、挂载后才按"今天"补日期。
 */

const HEAT_WEEKS = 16

const HEAT_VALUES = Array.from({ length: HEAT_WEEKS }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => {
    if (day > 4) return 0
    const wave = (Math.sin(week * 1.7 + day * 0.9) + 1) / 2
    return Math.round(Math.min(1, wave * (0.55 + week / 30)) * 20) / 20
  }),
)

/* ── returns-calendar ──────────────────────────────────────────────────────
 * `returns[年][月]` 是百分比（十二个月），`years` 是每行的标签；行尾的 Year 列由模型复利算。
 * 缺的月份按 0 补，不会串到下一行。
 */

const RETURNS_YEARS = [2021, 2022, 2023, 2024, 2025]

const RETURNS_BY_YEAR = [
  [2.1, 4.3, 1.8, -0.9, 2.4, 3.1, 0.6, 2.9, -1.4, 3.8, 2.2, 4.1],
  [-3.2, -1.8, 2.4, -4.1, 0.9, -2.6, 3.4, -1.2, -3.8, 2.7, -0.4, 1.9],
  [1.4, 2.8, -0.7, 3.2, 1.1, 4.6, 2.3, -1.9, 0.8, 3.5, 4.2, 2.6],
  [0.9, -1.6, 2.7, 1.3, 3.9, -0.5, 2.1, 4.4, 1.7, -2.2, 3.1, 5.2],
  [2.6, 3.4, -1.1, 1.9, 4.8, 2.2, -0.8, 3.7, 5.1, 1.4, 2.9, 3.6],
]

/**
 * beUI 的十个数据可视化组件（charts 目录八个 + motion 目录的 bracket / wheel 两个）。
 * 它们大多自己拥有布局（SVG 等比缩放，或写着固定像素），所以每个 Demo 都给 `height` 换成
 * 定高块，否则一个图表就能把整页拉到几千像素；数据是写死的小样本，只代表形状与交互。
 */
export function ChartsSection() {
  return (
    <Section
      title="Charts"
      description="beUI data visualisations: ranking bumps, stacked composition, conversion funnels, liquidity, price targets, depth ladders and calendars. Hover, focus and click the parts — most of them are interactive."
    >
      <Demo label="bump-chart" height={430} className="p-4">
        <div className="max-w-[640px]">
          <BumpChart
            series={BUMP_SERIES}
            periods={BUMP_PERIODS}
            label="Framework rank by month"
          />
        </div>
      </Demo>

      <Demo label="composition-chart" height={460} className="p-4">
        <CompositionChart
          series={COMPOSITION_SERIES}
          periods={COMPOSITION_PERIODS}
          label="Revenue mix by quarter"
        />
      </Demo>

      <Demo label="funnel-chart" height={560} className="p-4">
        <FunnelChart
          stages={FUNNEL_STAGES}
          unit="users"
          label="Signup funnel"
          className="max-w-[560px]"
        />
      </Demo>

      <Demo label="liquidity-heatmap" height={240} className="p-4">
        <LiquidityHeatmap
          snapshots={LIQUIDITY_SNAPSHOTS}
          maxSize={80}
          unit="BTC"
          label="Resting liquidity by price"
        />
      </Demo>

      <Demo label="price-target-fan" height={340} className="p-4">
        <PriceTargetFan
          current={214.5}
          targets={PRICE_TARGETS}
          history={PRICE_HISTORY}
          dates={{ start: 'Oct 2025', mid: 'Apr 2026', horizon: 'Sep 2027' }}
          label="Price target · 12 months"
        />
      </Demo>

      <Demo label="order-book" height={600} className="p-4">
        <OrderBook
          bids={BOOK_BIDS}
          asks={BOOK_ASKS}
          levels={6}
          lastPrice={68012.5}
          baseSymbol="BTC"
          quoteSymbol="USD"
        />
      </Demo>

      <Demo label="heat-calendar" height={240} className="p-4">
        <HeatCalendar
          unit="commits"
          weeks={HEAT_WEEKS}
          maxCount={12}
          values={HEAT_VALUES}
          endDate={new Date('2026-09-27')}
          color={SERIES_COLORS.success}
        />
      </Demo>

      <Demo label="returns-calendar" height={240} className="p-4">
        <ReturnsCalendar years={RETURNS_YEARS} returns={RETURNS_BY_YEAR} />
      </Demo>

      {/*
        bracket / wheel 住在 `components/motion/`，是单败淘汰赛的两种画法，共用同一套样例数据
        （每轮比赛数减半，`matches[k]` 由上一轮的 `2k` / `2k+1` 喂出来），各自用自己导出的
        ROUNDS。`initialRound` 是左起第一列 / 最外圈，传 2 就只画最后几轮。第三名决赛用 `thirdPlace`。
      */}
      <Demo label="knockout-bracket" height={880} className="p-4">
        <KnockoutBracket
          rounds={BRACKET_ROUNDS}
          initialRound={2}
          thirdPlace={THIRD_PLACE}
          thirdPlaceLabel="Third place play-off"
        />
      </Demo>

      <Demo label="knockout-wheel" height={600} className="p-4">
        <KnockoutWheel rounds={WHEEL_ROUNDS} initialRound={2} />
      </Demo>
    </Section>
  )
}
