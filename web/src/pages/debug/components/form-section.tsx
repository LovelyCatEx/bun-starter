import { useState } from 'react'

import { Checkbox } from '@/components/motion/checkbox'
import {
  ColorSelector,
  ColorSelectorItem,
  ColorSelectorLabel,
  ColorSelectorList,
} from '@/components/motion/color-selector'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/motion/combobox'
import { Input } from '@/components/motion/input'
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectEmpty,
  MultiSelectInput,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/motion/multi-select'
import { OTPInput } from '@/components/motion/otp-input'
import { RadioGroup, RadioGroupItem } from '@/components/motion/radio'
import { BubbleSlider } from '@/components/motion/range-slider-bubble'
import { FluidSlider } from '@/components/motion/range-slider-fluid'
import { InlineSlider } from '@/components/motion/range-slider-inline'
import { RulerSlider } from '@/components/motion/range-slider-ruler'
import { WaveSlider } from '@/components/motion/range-slider-wave'
import { RangeSlider } from '@/components/motion/range-slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/motion/select'
import {
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from '@/components/motion/select-morph'
import { SignUpForm } from '@/components/motion/signup-form'
import { Switch } from '@/components/motion/switch'
import { WheelPicker } from '@/components/motion/wheel-picker'
import { Demo, Section } from '@/pages/debug/components/section'

const FRAMEWORKS = [
  { value: 'bun', label: 'Bun' },
  { value: 'elysia', label: 'Elysia' },
  { value: 'drizzle', label: 'Drizzle ORM' },
  { value: 'vite', label: 'Vite' },
]

const TOPPINGS = ['Cheese', 'Olives', 'Basil']

const CITIES = [
  { value: 'amsterdam', label: 'Amsterdam', keywords: ['netherlands', 'nl'] },
  { value: 'berlin', label: 'Berlin', keywords: ['germany', 'de'] },
  { value: 'kyoto', label: 'Kyoto', keywords: ['japan', 'jp'] },
  { value: 'lisbon', label: 'Lisbon', keywords: ['portugal', 'pt'] },
  { value: 'taipei', label: 'Taipei', keywords: ['taiwan', 'tw'] },
  { value: 'zurich', label: 'Zürich', keywords: ['switzerland', 'ch'] },
]

const TOPICS = ['Design systems', 'Motion', 'Accessibility', 'Documentation', 'Testing']

const REMINDER_TIMES = ['08:00', '09:30', '12:00', '15:30', '18:00', '20:30', '22:00']

/**
 * Swatches read the theme tokens, so picking a theme color repaints the whole
 * selector too — the point of showing it here rather than with literal hexes.
 */
const SWATCHES = [
  { value: 'primary', color: 'var(--primary)', label: 'Primary' },
  { value: 'destructive', color: 'var(--destructive)', label: 'Destructive' },
  { value: 'success', color: 'var(--color-success)', label: 'Success' },
  { value: 'muted', color: 'var(--muted-foreground)', label: 'Muted' },
]

const STAGE = 'flex items-center justify-center p-6'

export function FormSection() {
  const [email, setEmail] = useState('')
  const [toppings, setToppings] = useState<string[]>(['Cheese'])
  const [terms, setTerms] = useState(false)
  const [plan, setPlan] = useState('monthly')
  const [notify, setNotify] = useState(true)
  const [framework, setFramework] = useState('bun')
  const [morphFramework, setMorphFramework] = useState('elysia')
  const [city, setCity] = useState('kyoto')
  const [topics, setTopics] = useState<string[]>(['Motion'])
  const [otp, setOtp] = useState('')
  const [swatch, setSwatch] = useState('primary')
  const [time, setTime] = useState('09:30')
  const [range, setRange] = useState(64)
  const [bubble, setBubble] = useState(240)
  const [fluid, setFluid] = useState(38)
  const [inline, setInline] = useState(55)
  const [ruler, setRuler] = useState(72)
  const [wave, setWave] = useState(35)

  const allToppings = toppings.length === TOPPINGS.length
  const someToppings = toppings.length > 0 && !allToppings
  const emailError =
    email.length > 0 && !email.includes('@') ? 'That address is missing an @.' : undefined

  return (
    <Section
      title="Forms & inputs"
      description="Inputs, pickers and sliders from components/motion. Every control here is wired to real state — type, toggle, pick and drag; nothing is a static mock."
    >
      <Demo label="input">
        <Input
          className="w-64"
          label="Work email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          error={emailError}
          success={email.length > 0 && !emailError}
          reserveErrorLine
        />
        <Input
          className="w-64"
          label="Read only"
          defaultValue="hard-coded@bun.starter"
          disabled
        />
      </Demo>

      <Demo label="checkbox">
        <div className="flex flex-col gap-3">
          <Checkbox
            checked={allToppings}
            indeterminate={someToppings}
            onCheckedChange={(next) => setToppings(next ? [...TOPPINGS] : [])}
            label="Everything"
          />
          <div className="ml-8 flex flex-col gap-3">
            {TOPPINGS.map((item) => (
              <Checkbox
                key={item}
                checked={toppings.includes(item)}
                onCheckedChange={(next) =>
                  setToppings((current) =>
                    next ? [...current, item] : current.filter((value) => value !== item),
                  )
                }
                label={item}
              />
            ))}
          </div>
          <Checkbox checked={terms} onCheckedChange={setTerms} label="I accept the terms" />
          <Checkbox checked={false} onCheckedChange={() => {}} disabled label="Disabled" />
        </div>
      </Demo>

      <Demo label="radio">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Billing cycle</span>
          <RadioGroup value={plan} onValueChange={setPlan} orientation="horizontal">
            <RadioGroupItem value="monthly" label="Monthly" />
            <RadioGroupItem value="yearly" label="Yearly" />
            <RadioGroupItem value="lifetime" label="Lifetime" />
          </RadioGroup>
          <span className="text-xs text-muted-foreground">Selected: {plan}</span>
        </div>
      </Demo>

      <Demo label="switch">
        <Switch checked={notify} onCheckedChange={setNotify} label="Notifications" />
        <Switch
          checked={notify}
          onCheckedChange={setNotify}
          ariaLabel="Notifications, without a visible label"
        />
        <Switch checked={false} onCheckedChange={() => {}} disabled label="Disabled" />
      </Demo>

      {/* SelectTrigger takes only `className` + `children`, so the caption has
          to be a visible span — there is no `htmlFor` to point at. */}
      <Demo label="select">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Framework</span>
          <Select value={framework} onValueChange={setFramework}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pick a framework" />
            </SelectTrigger>
            <SelectContent>
              {FRAMEWORKS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Disabled</span>
          <Select value="bun" onValueChange={() => {}} disabled>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FRAMEWORKS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Demo>

      <Demo label="select-morph">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Framework</span>
            <MorphSelect
              className="w-[180px]"
              value={morphFramework}
              onValueChange={setMorphFramework}
            >
              <MorphSelectTrigger>
                <MorphSelectValue placeholder="Pick a framework" />
              </MorphSelectTrigger>
              <MorphSelectContent>
                {FRAMEWORKS.map((item) => (
                  <MorphSelectItem key={item.value} value={item.value}>
                    {item.label}
                  </MorphSelectItem>
                ))}
              </MorphSelectContent>
            </MorphSelect>
          </div>
          <p className="max-w-lg text-xs text-muted-foreground">
            The trigger is the panel — one shared layout id, so it grows open and shrinks back
            instead of a detached dropdown appearing next to it.
          </p>
        </div>
      </Demo>

      <Demo label="combobox">
        <div className="flex flex-col gap-2">
          <Combobox value={city} onValueChange={setCity}>
            <ComboboxTrigger className="w-72">
              <ComboboxInput placeholder="Search cities…" aria-label="Search cities" />
            </ComboboxTrigger>
            <ComboboxContent className="w-72">
              <ComboboxList ariaLabel="Cities">
                <ComboboxEmpty>No city matches that.</ComboboxEmpty>
                {CITIES.map((item) => (
                  <ComboboxItem
                    key={item.value}
                    value={item.value}
                    textValue={item.label}
                    keywords={item.keywords}
                  >
                    {item.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <span className="text-xs text-muted-foreground">Selected: {city}</span>
        </div>
      </Demo>

      <Demo label="multi-select">
        <div className="flex flex-col gap-2">
          <MultiSelect value={topics} onValueChange={setTopics}>
            <MultiSelectTrigger className="w-80">
              <MultiSelectValue placeholder="Pick topics" />
              <MultiSelectInput aria-label="Search topics" placeholder="Add a topic…" />
            </MultiSelectTrigger>
            <MultiSelectContent className="w-80">
              <MultiSelectList ariaLabel="Topics">
                <MultiSelectEmpty>Nothing left to pick.</MultiSelectEmpty>
                {TOPICS.map((item) => (
                  <MultiSelectItem key={item} value={item}>
                    {item}
                  </MultiSelectItem>
                ))}
              </MultiSelectList>
            </MultiSelectContent>
          </MultiSelect>
          <span className="text-xs text-muted-foreground">
            Selected: {topics.length > 0 ? topics.join(', ') : 'none'}
          </span>
        </div>
      </Demo>

      <Demo label="otp-input">
        <OTPInput
          length={6}
          label="Verification code"
          hint="Six digits — 000000 is rejected on purpose."
          value={otp}
          onChange={setOtp}
          status={otp.length < 6 ? 'idle' : otp === '000000' ? 'error' : 'success'}
          errorMessage="That code ends in 000000."
          successMessage="Code accepted."
        />
      </Demo>

      <Demo label="color-selector">
        <div className="flex flex-col gap-3">
          <ColorSelector value={swatch} onValueChange={setSwatch}>
            <ColorSelectorLabel>Accent</ColorSelectorLabel>
            <ColorSelectorList>
              {SWATCHES.map((item) => (
                <ColorSelectorItem
                  key={item.value}
                  value={item.value}
                  color={item.color}
                  label={item.label}
                />
              ))}
            </ColorSelectorList>
          </ColorSelector>
          <span className="text-xs text-muted-foreground">Selected: {swatch}</span>
        </div>
      </Demo>

      <Demo label="wheel-picker" height={360} className={STAGE}>
        <div className="flex flex-col items-center gap-3">
          <WheelPicker
            aria-label="Reminder time"
            className="w-56"
            options={REMINDER_TIMES}
            value={time}
            onValueChange={setTime}
            visibleCount={5}
            itemHeight={36}
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            Reminder at {time}
          </span>
        </div>
      </Demo>

      <Demo label="signup-form" height={700} className={STAGE}>
        <SignUpForm
          onSubmit={async () => {
            await new Promise((resolve) => setTimeout(resolve, 900))
          }}
        />
      </Demo>

      <Demo label="range-slider" height={160} className={STAGE}>
        <div className="w-full max-w-md">
          <RangeSlider
            aria-label="Volume"
            value={range}
            onValueChange={setRange}
            min={0}
            max={100}
            step={1}
            showTicks
          />
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">Volume {range}%</p>
        </div>
      </Demo>

      <Demo label="range-slider-bubble" height={160} className={STAGE}>
        <div className="w-full max-w-md">
          <BubbleSlider
            aria-label="Budget"
            value={bubble}
            onValueChange={setBubble}
            min={0}
            max={500}
            step={10}
            format={(value) => `$${value}`}
          />
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">Budget ${bubble}</p>
        </div>
      </Demo>

      <Demo label="range-slider-fluid" height={160} className={STAGE}>
        <div className="w-full max-w-md">
          <FluidSlider
            aria-label="Opacity"
            label="Opacity"
            value={fluid}
            onValueChange={setFluid}
            min={0}
            max={100}
            step={1}
            format={(value) => `${value}%`}
          />
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">Opacity {fluid}%</p>
        </div>
      </Demo>

      <Demo label="range-slider-inline" height={160} className={STAGE}>
        <div className="w-full max-w-md">
          <InlineSlider
            aria-label="Zoom"
            label="Zoom"
            value={inline}
            onValueChange={setInline}
            min={0}
            max={100}
            step={1}
            format={(value) => `${value}%`}
            showTicks
          />
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">Zoom {inline}%</p>
        </div>
      </Demo>

      <Demo label="range-slider-ruler" height={200} className={STAGE}>
        <div className="w-full max-w-md">
          <RulerSlider
            aria-label="Weight"
            value={ruler}
            onValueChange={setRuler}
            min={0}
            max={120}
            step={1}
            unit="kg"
            gap={14}
            majorEvery={5}
          />
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">Weight {ruler} kg</p>
        </div>
      </Demo>

      <Demo label="range-slider-wave" height={200} className={STAGE}>
        <div className="w-full max-w-md">
          <WaveSlider
            aria-label="Intensity"
            value={wave}
            onValueChange={setWave}
            min={0}
            max={100}
            step={1}
            bars={48}
          />
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">Intensity {wave}%</p>
        </div>
      </Demo>

      <p className="text-xs text-muted-foreground">
        Every slider here takes a single number (`value` / `onValueChange(value: number)`), not
        the two-element array shadcn&apos;s Slider uses, and each variant drops a few options —
        check the variant&apos;s own file before passing one.
      </p>
    </Section>
  )
}
