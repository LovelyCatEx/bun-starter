import { useEffect, useState } from 'react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  HomeIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  TrashIcon,
  UsersIcon,
} from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Demo, Section } from '@/pages/debug/components/section'

function CardDemo() {
  return (
    <Demo label="Card" className="items-stretch">
      <Card className="w-72">
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Deploy the project in one click.</CardDescription>
          <CardAction>
            <Badge variant="outline">New</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Cards use bg-card and ring-foreground/10, so the day/night switch recolors
          them.
        </CardContent>
        <CardFooter className="gap-2">
          <Button size="sm">Deploy</Button>
          <Button size="sm" variant="ghost">
            Cancel
          </Button>
        </CardFooter>
      </Card>
      <Card size="sm" className="w-72">
        <CardHeader>
          <CardTitle>Small card</CardTitle>
          <CardDescription>size=&quot;sm&quot;</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Tighter spacing.
        </CardContent>
      </Card>
    </Demo>
  )
}

function ItemDemo() {
  return (
    <Demo label="Item" className="items-stretch">
      <ItemGroup className="max-w-md">
        <Item variant="outline">
          <ItemMedia variant="icon">
            <FileTextIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>report.pdf</ItemTitle>
            <ItemDescription>Generated 2 minutes ago.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="icon-sm" aria-label="Download">
              <DownloadIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Delete">
              <TrashIcon />
            </Button>
          </ItemActions>
        </Item>
        <ItemSeparator />
        <Item variant="muted" size="xs">
          <ItemMedia variant="icon">
            <ImageIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>cover.png</ItemTitle>
            <ItemDescription>size=&quot;xs&quot;, variant=&quot;muted&quot;.</ItemDescription>
          </ItemContent>
        </Item>
        <Item>
          <ItemHeader>
            <ItemMedia variant="icon">
              <StarIcon />
            </ItemMedia>
            <Badge variant="secondary">header</Badge>
          </ItemHeader>
          <ItemContent>
            <ItemTitle>Item header and footer</ItemTitle>
            <ItemDescription>
              ItemHeader and ItemFooter span the full width.
            </ItemDescription>
          </ItemContent>
          <ItemFooter>
            <span className="text-xs text-muted-foreground">Updated today</span>
            <Button size="xs" variant="ghost">
              Open
            </Button>
          </ItemFooter>
        </Item>
      </ItemGroup>
    </Demo>
  )
}

function EmptyDemo() {
  return (
    <Demo label="Empty" className="items-stretch">
      <Empty className="max-w-md border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchIcon />
          </EmptyMedia>
          <EmptyTitle>No results</EmptyTitle>
          <EmptyDescription>
            Try a different search term or clear the filters.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm">
            Clear filters
          </Button>
        </EmptyContent>
      </Empty>
    </Demo>
  )
}

function ResizableDemo() {
  return (
    <Demo label="Resizable" className="items-stretch">
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-44 max-w-2xl rounded-xl border"
      >
        <ResizablePanel defaultSize={40} minSize={20} className="p-4 text-sm text-muted-foreground">
          Drag the handle — this panel is 40%.
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60} className="p-4 text-sm text-muted-foreground">
          Second panel.
        </ResizablePanel>
      </ResizablePanelGroup>
    </Demo>
  )
}

function CollapsibleDemo() {
  const [open, setOpen] = useState(false)

  return (
    <Demo label="Collapsible" className="items-stretch">
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="w-full max-w-md space-y-2"
      >
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <span className="text-sm font-medium">Starred repositories</span>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Toggle">
              <ChevronDownIcon className={open ? 'rotate-180' : ''} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="rounded-lg border p-3 text-sm text-muted-foreground">
          Content is mounted while opening and unmounted once closed.
          <div className="mt-2 flex items-center gap-2">
            <ChevronRightIcon className="size-4" />
            <span>A second line of content.</span>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Demo>
  )
}

function AccordionDemo() {
  return (
    <Demo label="Accordion" className="items-stretch">
      <Accordion type="single" collapsible defaultValue="faq-1" className="max-w-md">
        <AccordionItem value="faq-1">
          <AccordionTrigger>Is it themed?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Yes — every token flips with the toggle in the header.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-2">
          <AccordionTrigger>Does it work in dark mode?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Switch the theme and come back: the borders, text and hover states all
            change.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Demo>
  )
}

function CarouselStatus() {
  const { canScrollNext, canScrollPrev, scrollNext, scrollPrev } = useCarousel()

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <Button
        variant="ghost"
        size="xs"
        disabled={!canScrollPrev}
        onClick={scrollPrev}
      >
        prev
      </Button>
      <span>
        canScrollPrev: {String(canScrollPrev)} · canScrollNext:{' '}
        {String(canScrollNext)}
      </span>
      <Button
        variant="ghost"
        size="xs"
        disabled={!canScrollNext}
        onClick={scrollNext}
      >
        next
      </Button>
    </div>
  )
}

function CarouselDemo() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)

    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  return (
    <Demo label="Carousel" className="flex-col items-stretch">
      <div className="px-12">
        <Carousel setApi={setApi} className="w-full max-w-md">
          <CarouselContent>
            {['Overview', 'Components', 'Tokens'].map((slide, index) => (
              <CarouselItem key={slide}>
                <div className="flex h-32 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
                  Slide {index + 1} — {slide}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselStatus />
        </Carousel>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Slide {current + 1} of 3</span>
        <a href="#layout" className={buttonVariants({ variant: 'ghost', size: 'xs' })}>
          skip
        </a>
      </div>
    </Demo>
  )
}

function SidebarStateReadout() {
  const { isMobile, state, toggleSidebar } = useSidebar()

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>state: {state}</span>
      <span>· isMobile: {String(isMobile)}</span>
      <Button size="xs" variant="outline" onClick={toggleSidebar}>
        useSidebar().toggleSidebar()
      </Button>
    </div>
  )
}

function SidebarDemo() {
  return (
    <Demo label="Sidebar" className="items-stretch">
      <div className="h-[420px] w-full overflow-hidden rounded-xl border">
        <SidebarProvider className="h-full min-h-0!">
          <Sidebar collapsible="none" className="border-r">
            <SidebarHeader>
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
                <span className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <StarIcon className="size-3.5" />
                </span>
                Relink
              </div>
              <SidebarInput placeholder="Search…" />
            </SidebarHeader>
            <SidebarSeparator />
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                <SidebarGroupAction aria-label="Add project">
                  <PlusIcon />
                </SidebarGroupAction>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive tooltip="Dashboard">
                        <HomeIcon />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                      <SidebarMenuAction showOnHover aria-label="More">
                        <MoreHorizontalIcon />
                      </SidebarMenuAction>
                      <SidebarMenuBadge>12</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Team">
                        <UsersIcon />
                        <span>Team</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Settings">
                        <SettingsIcon />
                        <span>Settings</span>
                        <ChevronRightIcon className="ml-auto" />
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton href="#layout" isActive>
                            Profile
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton href="#layout">
                            Billing
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <span className="px-2 text-xs text-muted-foreground">
                Signed in as ada
              </span>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset className="min-w-0">
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm font-medium">Sidebar demo</span>
            </header>
            <div className="flex-1 p-4 text-sm text-muted-foreground">
              <p>
                The sidebar is rendered with collapsible=&quot;none&quot; inside
                this frame, so the demo stays inside the card. SidebarProvider
                supplies the context for SidebarTrigger, SidebarRail and the menu
                tooltips.
              </p>
              <SidebarStateReadout />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </Demo>
  )
}

export function LayoutSection() {
  return (
    <Section
      title="Layout"
      description="Card, Item, Empty, Resizable, Collapsible, Accordion, Carousel and Sidebar."
    >
      <CardDemo />
      <ItemDemo />
      <EmptyDemo />
      <ResizableDemo />
      <CollapsibleDemo />
      <AccordionDemo />
      <CarouselDemo />
      <SidebarDemo />
    </Section>
  )
}
