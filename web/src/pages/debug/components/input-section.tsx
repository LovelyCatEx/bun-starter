import { useState } from 'react'
import { CheckIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Demo, Section } from '@/pages/debug/components/section'

const FRUIT_LABELS: Record<string, string> = {
  apple: 'Apple',
  banana: 'Banana',
  cherry: 'Cherry',
  carrot: 'Carrot',
  potato: 'Potato',
  tomato: 'Tomato',
}

const frameworks = ['next', 'svelte', 'vue', 'nuxt', 'remix']

const frameworkLabels: Record<string, string> = {
  next: 'Next.js',
  svelte: 'SvelteKit',
  vue: 'Vue',
  nuxt: 'Nuxt',
  remix: 'Remix',
}

const languages = ['react', 'typescript', 'bun', 'tailwind', 'drizzle']

function SelectDemo() {
  const [fruit, setFruit] = useState('apple')

  return (
    <Demo label="Select / NativeSelect">
      <Select value={fruit} onValueChange={setFruit}>
        <SelectTrigger className="w-52" aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="cherry">Cherry</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="potato" disabled>
              Potato
            </SelectItem>
            <SelectItem value="tomato">Tomato</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select defaultValue="banana">
        <SelectTrigger size="sm" className="w-40" aria-label="Fruit (small)">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">
        Selected: {FRUIT_LABELS[fruit]}
      </span>
      <NativeSelect defaultValue="auto" aria-label="Region">
        <NativeSelectOption value="auto">Auto</NativeSelectOption>
        <NativeSelectOptGroup label="Europe">
          <NativeSelectOption value="eu-west">EU West</NativeSelectOption>
          <NativeSelectOption value="eu-central">EU Central</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Americas">
          <NativeSelectOption value="us-east">US East</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
      <NativeSelect size="sm" defaultValue="auto" aria-label="Region (small)">
        <NativeSelectOption value="auto">Auto (sm)</NativeSelectOption>
        <NativeSelectOption value="eu-west">EU West</NativeSelectOption>
      </NativeSelect>
    </Demo>
  )
}

function InputGroupDemo() {
  return (
    <Demo label="InputGroup / InputOTP" className="items-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search components…" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>⌘K</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupAddon align="block-start">Description</InputGroupAddon>
          <InputGroupTextarea placeholder="Add a description…" />
          <InputGroupAddon align="block-end">
            <InputGroupButton variant="secondary" size="xs">
              Cancel
            </InputGroupButton>
            <InputGroupButton variant="default" size="xs">
              <CheckIcon />
              Save
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <OtpDemo />
    </Demo>
  )
}

function OtpDemo() {
  const [otp, setOtp] = useState('')

  return (
    <div className="flex flex-col gap-2">
      <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="gap-2">
        <InputOTPGroup>
          {[0, 1, 2].map((index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          {[3, 4, 5].map((index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <span className="text-xs text-muted-foreground">
        One-time code: {otp || '—'}
      </span>
    </div>
  )
}

function ComboboxDemo() {
  const [framework, setFramework] = useState('next')

  return (
    <Demo label="Combobox" className="items-stretch">
      <div className="flex flex-col gap-4">
        <Combobox
          items={frameworks}
          value={framework}
          onValueChange={(value) => setFramework(value ?? 'next')}
        >
          <ComboboxInput placeholder="Select a framework…" showClear className="w-72" />
          <ComboboxContent>
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {frameworkLabels[item]}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Combobox items={frameworks} defaultValue="svelte">
          <ComboboxTrigger
            render={
              <Button
                variant="outline"
                className="w-72 justify-between font-normal"
              />
            }
            aria-label="Framework"
          >
            <ComboboxValue />
          </ComboboxTrigger>
          <ComboboxContent>
            <ComboboxList>
              <ComboboxGroup>
                <ComboboxLabel>Frontend</ComboboxLabel>
                <ComboboxCollection>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {frameworkLabels[item]}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
              <ComboboxSeparator />
              <ComboboxGroup>
                <ComboboxLabel>Meta frameworks</ComboboxLabel>
                <ComboboxItem value="next">Next.js</ComboboxItem>
                <ComboboxItem value="nuxt">Nuxt</ComboboxItem>
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <ChipsCombobox />
      </div>
    </Demo>
  )
}

function ChipsCombobox() {
  const anchor = useComboboxAnchor()
  const [selected, setSelected] = useState<string[]>(['react', 'bun'])

  return (
    <Combobox
      multiple
      items={languages}
      value={selected}
      onValueChange={(value) => setSelected(value)}
    >
      <ComboboxChips ref={anchor} className="w-full max-w-md">
        <ComboboxValue>
          {(value: string[]) => (
            <>
              {value.map((item) => (
                <ComboboxChip key={item}>{item}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder="Add a language…" />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>Everything is already selected.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Demo label="Calendar" className="items-stretch">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-xl border"
      />
      <div className="text-sm text-muted-foreground">
        Selected:{' '}
        <span className="font-medium text-foreground">
          {date ? date.toDateString() : 'none'}
        </span>
      </div>
    </Demo>
  )
}

function QuestionnaireDemo() {
  const [submitted, setSubmitted] = useState<string | null>(null)

  return (
    <Demo label="Questionnaire" className="items-stretch">
      <Questionnaire
        className="w-full max-w-xl rounded-xl border p-4"
        shortcuts="numbers"
        items={[
          {
            name: 'goal',
            required: true,
            choices: [{ value: 'ship' }, { value: 'learn' }, { value: 'explore' }],
          },
          {
            name: 'stack',
            choices: [{ value: 'react' }, { value: 'bun' }, { value: 'drizzle' }],
          },
          { name: 'notes' },
        ]}
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          setSubmitted(
            Array.from(data.entries())
              .map(([key, value]) => `${key}=${String(value)}`)
              .join(', '),
          )
        }}
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="goal" required>
          <QuestionnaireTitle>What do you want to do next?</QuestionnaireTitle>
          <QuestionnaireDescription>
            Use the number keys or click a choice.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="ship">
              Ship it
              <QuestionnaireChoiceDescription>
                Deploy today.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
            <QuestionnaireChoice value="learn">
              Learn something
              <QuestionnaireChoiceDescription>
                Read the registry source.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
            <QuestionnaireChoice value="explore">
              Explore the page
              <QuestionnaireChoiceDescription>
                Flip the theme and look around.
              </QuestionnaireChoiceDescription>
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="stack" multiple>
          <QuestionnaireTitle>Which tools do you use?</QuestionnaireTitle>
          <QuestionnaireDescription>Select as many as you like.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="react">React</QuestionnaireChoice>
            <QuestionnaireChoice value="bun">Bun</QuestionnaireChoice>
            <QuestionnaireChoice value="drizzle">Drizzle</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
        <QuestionnaireItem name="notes">
          <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
          <QuestionnaireDescription>Optional free text.</QuestionnaireDescription>
          <QuestionnaireInput placeholder="Notes…" />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireActions>
      </Questionnaire>
      {submitted ? (
        <p className="text-xs text-muted-foreground">Submitted → {submitted}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Submit the last question to see the form values here.
        </p>
      )}
    </Demo>
  )
}

export function InputSection() {
  return (
    <Section
      title="Inputs"
      description="Select, NativeSelect, InputGroup, InputOTP, Combobox, Calendar and Questionnaire."
    >
      <SelectDemo />
      <InputGroupDemo />
      <ComboboxDemo />
      <CalendarDemo />
      <QuestionnaireDemo />
    </Section>
  )
}
