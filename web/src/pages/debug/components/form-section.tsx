import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Demo, Section } from '@/pages/debug/components/section'

function FieldDemo() {
  return (
    <Demo label="Field / FieldSet / FieldGroup" className="items-stretch">
      <FieldSet className="w-full max-w-md rounded-xl border p-4">
        <FieldLegend>Profile</FieldLegend>
        <FieldDescription>
          Field handles labels, descriptions, errors and orientation.
        </FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="debug-name">Name</FieldLabel>
            <Input id="debug-name" placeholder="Ada Lovelace" />
            <FieldDescription>Shown on your public profile.</FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="debug-newsletter" defaultChecked />
            <FieldContent>
              <FieldTitle>Newsletter</FieldTitle>
              <FieldDescription>A short digest every Friday.</FieldDescription>
            </FieldContent>
          </Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field data-invalid>
            <FieldLabel htmlFor="debug-email">Email</FieldLabel>
            <Input id="debug-email" aria-invalid placeholder="you@example.com" />
            <FieldError errors={[{ message: 'Enter a valid email address.' }]} />
          </Field>
          <Field orientation="responsive">
            <FieldLabel htmlFor="debug-team">Team</FieldLabel>
            <Input id="debug-team" placeholder="Platform" />
          </Field>
        </FieldGroup>
      </FieldSet>
    </Demo>
  )
}

function InputDemo() {
  return (
    <Demo label="Input / Label / Textarea" className="items-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="debug-input">Label + Input</Label>
          <Input id="debug-input" placeholder="Type something…" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="debug-input-disabled">Disabled</Label>
          <Input id="debug-input-disabled" disabled defaultValue="read only value" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="debug-input-file">File</Label>
          <Input id="debug-input-file" type="file" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="debug-textarea">Textarea</Label>
          <Textarea id="debug-textarea" placeholder="Write a longer answer…" rows={3} />
          <p className="text-xs text-muted-foreground">
            Textarea grows with field-sizing-content.
          </p>
        </div>
      </div>
    </Demo>
  )
}

function CheckboxDemo() {
  const [checked, setChecked] = useState(true)
  const [terms, setTerms] = useState(false)

  return (
    <Demo label="Checkbox / RadioGroup">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox id="debug-check" checked={checked} onCheckedChange={(value) => setChecked(value === true)} />
          <Label htmlFor="debug-check">Controlled checkbox</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="debug-check-disabled" disabled />
          <Label htmlFor="debug-check-disabled">Disabled checkbox</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="debug-check-terms"
            checked={terms}
            onCheckedChange={(value) => setTerms(value === true)}
            aria-invalid={!terms}
          />
          <Label htmlFor="debug-check-terms">Invalid until accepted</Label>
        </div>
      </div>
      <RadioGroup defaultValue="balanced" className="w-56">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="compact" id="debug-radio-compact" />
          <Label htmlFor="debug-radio-compact">Compact</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="balanced" id="debug-radio-balanced" />
          <Label htmlFor="debug-radio-balanced">Balanced</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="roomy" id="debug-radio-roomy" />
          <Label htmlFor="debug-radio-roomy">Roomy</Label>
        </div>
      </RadioGroup>
    </Demo>
  )
}

function SwitchDemo() {
  const [airplane, setAirplane] = useState(false)
  const [wifi, setWifi] = useState(true)

  return (
    <Demo label="Switch">
      <div className="flex items-center gap-2">
        <Switch checked={wifi} onCheckedChange={setWifi} id="debug-switch-wifi" />
        <Label htmlFor="debug-switch-wifi">Wi-Fi</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch size="sm" checked={airplane} onCheckedChange={setAirplane} id="debug-switch-airplane" />
        <Label htmlFor="debug-switch-airplane">Airplane mode (sm)</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch disabled />
        <Label>Disabled</Label>
      </div>
    </Demo>
  )
}

function SliderDemo() {
  const [volume, setVolume] = useState([40])

  return (
    <Demo label="Slider / Progress" className="flex-col items-stretch">
      <div className="w-full max-w-md">
        <Slider value={volume} onValueChange={setVolume} max={100} step={1} />
        <p className="mt-2 text-xs text-muted-foreground">Volume: {volume[0]}%</p>
      </div>
      <div className="w-full max-w-md">
        <Slider defaultValue={[25, 75]} />
        <p className="mt-2 text-xs text-muted-foreground">Range with two thumbs.</p>
      </div>
      <div className="w-full max-w-md">
        <Slider defaultValue={[50]} disabled />
        <p className="mt-2 text-xs text-muted-foreground">Disabled.</p>
      </div>
      <div className="flex w-full max-w-md flex-col gap-3">
        <Progress value={25} />
        <Progress value={66} className="h-2" />
        <Progress value={92} className="h-1.5" />
      </div>
    </Demo>
  )
}

function FormActionsDemo() {
  return (
    <Demo label="Button inside a form" className="items-stretch">
      <form
        className="flex w-full max-w-md items-end gap-2"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="debug-subscribe">Email</Label>
          <Input id="debug-subscribe" type="email" placeholder="you@example.com" />
        </div>
        <Button type="submit">Subscribe</Button>
        <Button type="reset" variant="outline">
          Reset
        </Button>
      </form>
    </Demo>
  )
}

export function FormSection() {
  return (
    <Section
      title="Form"
      description="Field primitives, Input, Label, Textarea, Checkbox, RadioGroup, Switch, Slider and Progress."
    >
      <FieldDemo />
      <InputDemo />
      <CheckboxDemo />
      <SwitchDemo />
      <SliderDemo />
      <FormActionsDemo />
    </Section>
  )
}
