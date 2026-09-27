import { useState } from 'react'
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArchiveIcon,
  BoldIcon,
  CopyIcon,
  InfoIcon,
  ItalicIcon,
  MailIcon,
  MinusIcon,
  StarIcon,
  TriangleAlertIcon,
  UnderlineIcon,
  XIcon,
} from 'lucide-react'

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from '@/components/ui/button-group'
import { DirectionProvider, useDirection } from '@/components/ui/direction'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Demo, Section } from '@/pages/debug/components/section'

const BUTTON_VARIANTS = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
] as const

const BUTTON_SIZES = [
  'xs',
  'sm',
  'default',
  'lg',
  'icon-xs',
  'icon-sm',
  'icon',
  'icon-lg',
] as const

const BADGE_VARIANTS = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'ghost',
  'link',
] as const

function DirectionReadout() {
  const direction = useDirection()

  return (
    <p className="text-sm text-muted-foreground">
      Direction context:{' '}
      <span className="font-medium text-foreground">{direction}</span>
    </p>
  )
}

export function BasicSection() {
  const [bold, setBold] = useState(false)
  const [align, setAlign] = useState('left')
  const [formatting, setFormatting] = useState<string[]>(['bold'])

  return (
    <Section
      title="Basic"
      description="Button, Badge, ButtonGroup, Kbd, Separator, Spinner, Skeleton, AspectRatio, ScrollArea, Toggle, ToggleGroup, Alert and Direction."
    >
      <Demo label="Button">
        {BUTTON_VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        <Button disabled>disabled</Button>
        <Button asChild>
          <a href="#basic">link child</a>
        </Button>
      </Demo>

      <Demo label="Button sizes">
        {BUTTON_SIZES.map((size) => (
          <Button key={size} size={size} variant="outline" aria-label={size}>
            {size.startsWith('icon') ? <StarIcon /> : size}
          </Button>
        ))}
      </Demo>

      <Demo label="Button group">
        <ButtonGroup>
          <Button variant="outline">
            <MailIcon />
            Mail
          </Button>
          <ButtonGroupSeparator />
          <Button variant="outline">
            <ArchiveIcon />
            Archive
          </Button>
          <ButtonGroupSeparator />
          <Button variant="outline" size="icon" aria-label="Copy">
            <CopyIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroupText>https://</ButtonGroupText>
          <Button variant="outline" size="sm">
            Open
          </Button>
        </ButtonGroup>
        <ButtonGroup orientation="vertical">
          <Button variant="outline" size="sm">
            Up
          </Button>
          <Button variant="outline" size="sm">
            Down
          </Button>
        </ButtonGroup>
      </Demo>

      <Demo label="Badge">
        {BADGE_VARIANTS.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
        <Badge variant="outline">
          <StarIcon />
          with icon
        </Badge>
        <a href="#basic" className={badgeVariants({ variant: 'link' })}>
          a styled with badgeVariants()
        </a>
      </Demo>

      <Demo label="Kbd">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          Press
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>B</Kbd>
          </KbdGroup>
          to toggle the sidebar
        </span>
        <Kbd>Esc</Kbd>
      </Demo>

      <Demo label="Separator" className="flex-col items-stretch">
        <div className="flex h-10 items-center gap-3 text-sm">
          <span>Left</span>
          <Separator orientation="vertical" />
          <span>Right</span>
        </div>
        <Separator />
      </Demo>

      <Demo label="Spinner">
        <Spinner />
        <Spinner className="size-6 text-muted-foreground" />
        <Button variant="outline" disabled>
          <Spinner />
          Loading
        </Button>
      </Demo>

      <Demo label="Skeleton">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </Demo>

      <Demo label="AspectRatio">
        <AspectRatio
          ratio={16 / 9}
          className="w-64 overflow-hidden rounded-lg border bg-muted"
        >
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            16 / 9
          </div>
        </AspectRatio>
        <AspectRatio
          ratio={1}
          className="w-24 overflow-hidden rounded-lg border bg-muted"
        >
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            1 / 1
          </div>
        </AspectRatio>
      </Demo>

      <Demo label="ScrollArea">
        <ScrollArea className="h-40 w-72 rounded-lg border">
          <div className="w-[560px] p-3">
            {Array.from({ length: 12 }, (_, index) => (
              <p key={index} className="py-1 text-sm text-muted-foreground">
                Scrollable row {index + 1} — drag the scrollbars.
              </p>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Demo>

      <Demo label="Toggle">
        <Toggle pressed={bold} onPressedChange={setBold} aria-label="Bold">
          <BoldIcon />
        </Toggle>
        <Toggle variant="outline" aria-label="Star">
          <StarIcon />
          Star
        </Toggle>
        <Toggle variant="outline" size="sm">
          small
        </Toggle>
        <Toggle variant="outline" size="lg">
          large
        </Toggle>
        <Toggle variant="outline" disabled>
          disabled
        </Toggle>
      </Demo>

      <Demo label="Toggle group">
        <ToggleGroup
          type="single"
          value={align}
          onValueChange={setAlign}
          variant="outline"
        >
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeftIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenterIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRightIcon />
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="multiple"
          value={formatting}
          onValueChange={setFormatting}
          spacing={1}
        >
          <ToggleGroupItem value="bold" aria-label="Bold">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <UnderlineIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="strike" aria-label="Strike through">
            <MinusIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </Demo>

      <Demo label="Alert" className="flex-col items-stretch">
        <Alert className="max-w-lg">
          <InfoIcon />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>
            Alerts are plain divs styled with the shadcn tokens.
          </AlertDescription>
          <AlertAction>
            <Button variant="ghost" size="icon-xs" aria-label="Dismiss">
              <XIcon />
            </Button>
          </AlertAction>
        </Alert>
        <Alert variant="destructive" className="max-w-lg">
          <TriangleAlertIcon />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            The destructive variant tints text and icons.
          </AlertDescription>
        </Alert>
      </Demo>

      <Demo label="DirectionProvider" className="flex-col items-start">
        <DirectionReadout />
        <DirectionProvider dir="rtl" direction="rtl">
          <div dir="rtl" className="rounded-lg border p-3">
            <DirectionReadout />
          </div>
        </DirectionProvider>
        <div dir="rtl" className="flex items-center gap-2 rounded-lg border p-3">
          <span className="inline-flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
            1
          </span>
          <span className="text-sm">Mirrored block inside an RTL provider.</span>
          <XIcon className="size-4" />
        </div>
      </Demo>
    </Section>
  )
}
