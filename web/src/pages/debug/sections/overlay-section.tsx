import { useState } from 'react'
import {
  BookmarkIcon,
  CalendarIcon,
  CopyIcon,
  CreditCardIcon,
  LinkIcon,
  MailIcon,
  PencilIcon,
  ScissorsIcon,
  SettingsIcon,
  SunIcon,
  TrashIcon,
  TriangleAlertIcon,
  UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Demo, Section } from '@/pages/debug/sections/section'

type SheetSide = 'top' | 'right' | 'bottom' | 'left'

const SHEET_SIDES: SheetSide[] = ['right', 'bottom', 'left', 'top']

function DialogDemo() {
  const [open, setOpen] = useState(false)

  return (
    <Demo label="Dialog">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              DialogContent portals the overlay and the panel automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dialog-name">Name</Label>
            <Input id="dialog-name" defaultValue="Ada Lovelace" />
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={() => setOpen(false)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost">Dialog without close button</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Heads up</DialogTitle>
            <DialogDescription>
              This dialog hides the built-in close button.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button variant="outline">Got it</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Demo>
  )
}

function AlertDialogDemo() {
  return (
    <Demo label="AlertDialog">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete project</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlertIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The project and its deployments will be
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Small alert dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard draft?</AlertDialogTitle>
            <AlertDialogDescription>
              size=&quot;sm&quot; stacks the footer buttons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Demo>
  )
}

function SheetDemo() {
  const [open, setOpen] = useState(false)
  const [side, setSide] = useState<SheetSide>('right')

  return (
    <Demo label="Sheet">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">Open sheet</Button>
        </SheetTrigger>
        <SheetContent side={side}>
          <SheetHeader>
            <SheetTitle>Sheet · {side}</SheetTitle>
            <SheetDescription>
              Sheets slide in from any edge and share the themable surface.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 text-sm text-muted-foreground">
            Body content for the {side} sheet.
          </div>
          <SheetFooter>
            <Button onClick={() => setOpen(false)}>Save</Button>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {SHEET_SIDES.map((value) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => {
            setSide(value)
            setOpen(true)
          }}
        >
          {value}
        </Button>
      ))}
    </Demo>
  )
}

function DrawerDemo() {
  const [open, setOpen] = useState(false)

  return (
    <Demo label="Drawer">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline">Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer</DrawerTitle>
            <DrawerDescription>
              Built on vaul, with the same tokens as the rest of the registry.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 text-sm text-muted-foreground">
            Drag the drawer down to dismiss it.
          </div>
          <DrawerFooter>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Demo>
  )
}

function PopoverDemo() {
  return (
    <Demo label="Popover">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              PopoverHeader, PopoverTitle and PopoverDescription compose the body.
            </PopoverDescription>
          </PopoverHeader>
          <div className="flex items-center gap-2">
            <Input defaultValue="320" aria-label="Width" />
            <Input defaultValue="240" aria-label="Height" />
          </div>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverAnchor asChild>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            anchor
          </span>
        </PopoverAnchor>
        <PopoverTrigger asChild>
          <Button variant="ghost">Anchored popover</Button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8}>
          <p className="text-muted-foreground">
            This panel is positioned against PopoverAnchor, not the trigger.
          </p>
        </PopoverContent>
      </Popover>
    </Demo>
  )
}

function HoverCardDemo() {
  return (
    <Demo label="HoverCard / Tooltip">
      <HoverCard openDelay={100}>
        <HoverCardTrigger asChild>
          <Button variant="link">@shadcn</Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-72">
          <div className="flex gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
              UI
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-medium">shadcn</span>
              <span className="text-sm text-muted-foreground">
                HoverCardContent lives in a portal and follows the theme.
              </span>
              <span className="text-xs text-muted-foreground">
                Joined December 2023
              </span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Tooltip with Kbd</Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>
          Add to favorites
          <Kbd>⌘D</Kbd>
        </TooltipContent>
      </Tooltip>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Theme">
            <SunIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Rendered from the page-level TooltipProvider</TooltipContent>
      </Tooltip>
    </Demo>
  )
}

function ContextMenuDemo() {
  const [showBookmarks, setShowBookmarks] = useState(true)
  const [person, setPerson] = useState('ada')

  return (
    <Demo label="ContextMenu" className="items-stretch">
      <ContextMenu>
        <ContextMenuTrigger className="flex h-28 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel>Edit</ContextMenuLabel>
          <ContextMenuGroup>
            <ContextMenuItem>
              <CopyIcon />
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <ScissorsIcon />
              Cut
              <ContextMenuShortcut>⌘X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <PencilIcon />
              Rename
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>
                  <MailIcon />
                  Email
                </ContextMenuItem>
                <ContextMenuItem>
                  <LinkIcon />
                  Copy link
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem
            checked={showBookmarks}
            onCheckedChange={(checked) => setShowBookmarks(checked === true)}
          >
            Show bookmarks
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
            <ContextMenuLabel>Assignee</ContextMenuLabel>
            <ContextMenuRadioItem value="ada">Ada</ContextMenuRadioItem>
            <ContextMenuRadioItem value="grace">Grace</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            <TrashIcon />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Demo>
  )
}

function DropdownMenuDemo() {
  const [showStatus, setShowStatus] = useState(true)
  const [position, setPosition] = useState('bottom')

  return (
    <Demo label="DropdownMenu">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open dropdown</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <UserIcon />
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCardIcon />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <SettingsIcon />
                Settings
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>General</DropdownMenuItem>
                <DropdownMenuItem>Appearance</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={showStatus}
            onCheckedChange={(checked) => setShowStatus(checked === true)}
          >
            Show status bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup
            value={position}
            onValueChange={(value) => setPosition(value)}
          >
            <DropdownMenuLabel>Position</DropdownMenuLabel>
            <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="text-xs text-muted-foreground">
        status: {String(showStatus)} · position: {position}
      </span>
    </Demo>
  )
}

function MenubarDemo() {
  const [bookmarks, setBookmarks] = useState(false)
  const [size, setSize] = useState('medium')

  return (
    <Demo label="Menubar" className="items-stretch">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New tab
              <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              New window
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Copy link</MenubarItem>
                <MenubarItem>Email</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Delete</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Panels</MenubarLabel>
              <MenubarCheckboxItem
                checked={bookmarks}
                onCheckedChange={(checked) => setBookmarks(checked === true)}
              >
                <BookmarkIcon className="size-4" />
                Show bookmarks
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarRadioGroup
              value={size}
              onValueChange={(value) => setSize(value)}
            >
              <MenubarLabel>Text size</MenubarLabel>
              <MenubarRadioItem value="small">Small</MenubarRadioItem>
              <MenubarRadioItem value="medium">Medium</MenubarRadioItem>
              <MenubarRadioItem value="large">Large</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Bookmarks</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <CalendarIcon />
              Release calendar
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Demo>
  )
}

function ToasterDemo() {
  return (
    <Demo label="Toaster (sonner)">
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Theme saved', {
            description: 'Your preference is stored locally.',
          })
        }
      >
        success
      </Button>
      <Button variant="outline" onClick={() => toast.info('Heads up')}>
        info
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Careful now')}>
        warning
      </Button>
      <Button variant="outline" onClick={() => toast.error('Something failed')}>
        error
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          const id = toast.loading('Deploying…')
          window.setTimeout(() => toast.success('Deployed', { id }), 1500)
        }}
      >
        loading → success
      </Button>
      <Button variant="ghost" onClick={() => toast('Plain toast')}>
        default
      </Button>
    </Demo>
  )
}

export function OverlaySection() {
  return (
    <Section
      title="Overlay"
      description="Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip, ContextMenu, DropdownMenu, Menubar and the sonner Toaster."
    >
      <DialogDemo />
      <AlertDialogDemo />
      <SheetDemo />
      <DrawerDemo />
      <PopoverDemo />
      <HoverCardDemo />
      <ContextMenuDemo />
      <DropdownMenuDemo />
      <MenubarDemo />
      <ToasterDemo />
    </Section>
  )
}
