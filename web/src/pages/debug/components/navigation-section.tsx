import { useState } from 'react'
import {
  ChartBarIcon,
  CreditCardIcon,
  LayoutGridIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Demo, Section } from '@/pages/debug/components/section'

const NAV_ITEMS = [
  {
    title: 'Introduction',
    description: 'Re-usable components built with Tailwind.',
  },
  {
    title: 'Installation',
    description: 'How to install dependencies and structure your app.',
  },
]

function NavigationMenuDemo() {
  return (
    <Demo label="NavigationMenu">
      <NavigationMenu className="rounded-lg border px-2 py-1">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-72 gap-1 p-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.title}>
                    <NavigationMenuLink
                      href="#navigation"
                      className="flex-col items-start gap-0.5"
                    >
                      <span className="font-medium">{item.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#navigation">Docs</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#navigation">Components</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <a
              href="#navigation"
              className={navigationMenuTriggerStyle()}
            >
              Styled with navigationMenuTriggerStyle()
            </a>
          </NavigationMenuItem>
          <NavigationMenuIndicator />
        </NavigationMenuList>
      </NavigationMenu>
    </Demo>
  )
}

function TabsDemo() {
  return (
    <Demo label="Tabs" className="items-stretch">
      <Tabs defaultValue="overview" className="max-w-md">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutGridIcon />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <ChartBarIcon />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" disabled>
            Reports
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="rounded-lg border p-3 text-muted-foreground">
          TabsContent for the overview tab.
        </TabsContent>
        <TabsContent value="analytics" className="rounded-lg border p-3 text-muted-foreground">
          TabsContent for the analytics tab.
        </TabsContent>
      </Tabs>
      <Tabs defaultValue="account" orientation="vertical" className="max-w-sm">
        <TabsList variant="line">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="text-muted-foreground">
          variant=&quot;line&quot; with orientation=&quot;vertical&quot;.
        </TabsContent>
        <TabsContent value="billing" className="text-muted-foreground">
          A second vertical panel.
        </TabsContent>
      </Tabs>
    </Demo>
  )
}

function BreadcrumbDemo() {
  return (
    <Demo label="Breadcrumb / Pagination" className="flex-col items-start">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#navigation">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#navigation">Debug</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Theme</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#navigation" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#navigation">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#navigation" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#navigation">9</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#navigation" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Demo>
  )
}

function CommandDemo() {
  const [open, setOpen] = useState(false)

  return (
    <Demo label="Command / CommandDialog" className="flex-col items-start">
      <div className="w-full max-w-md rounded-xl border shadow-sm">
        <Command>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <LayoutGridIcon />
                <span>Dashboard</span>
                <CommandShortcut>⌘D</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem>
                <UserIcon />
                <span>Profile</span>
              </CommandItem>
              <CommandItem disabled>
                <CreditCardIcon />
                <span>Billing (disabled)</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open command palette
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command palette"
        description="Search for a command to run"
      >
        <CommandInput placeholder="Type a command…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => setOpen(false)}>
              <LayoutGridIcon />
              <span>New component</span>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <SettingsIcon />
              <span>Open settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </Demo>
  )
}

export function NavigationSection() {
  return (
    <Section
      title="Navigation"
      description="NavigationMenu, Tabs, Breadcrumb, Pagination and Command."
    >
      <NavigationMenuDemo />
      <TabsDemo />
      <BreadcrumbDemo />
      <CommandDemo />
    </Section>
  )
}
