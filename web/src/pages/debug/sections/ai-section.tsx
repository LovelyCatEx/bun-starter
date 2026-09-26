import { useState } from 'react'
import {
  CopyIcon,
  FileTextIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment'
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from '@/components/ui/message-scroller'
import { Spinner } from '@/components/ui/spinner'
import { Demo, Section } from '@/pages/debug/sections/section'

type ChatMessage = {
  id: string
  from: 'user' | 'assistant'
  text: string
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    from: 'assistant',
    text: 'Hi! Ask me anything about the shadcn tokens on this page.',
  },
  {
    id: 'm-2',
    from: 'user',
    text: 'Which token should I use for a page background?',
  },
  {
    id: 'm-3',
    from: 'assistant',
    text: 'bg-background plus text-foreground — both flip with the day/night switch.',
  },
]

function MarkerDemo() {
  return (
    <Demo label="Marker" className="items-stretch">
      <Marker>
        <MarkerIcon>
          <SparklesIcon />
        </MarkerIcon>
        <MarkerContent>
          Marker is the thin meta line used above and between messages.
        </MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>Marker with variant=&quot;border&quot;.</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
    </Demo>
  )
}

function AttachmentDemo() {
  const [opened, setOpened] = useState<string | null>(null)

  return (
    <Demo label="Attachment" className="items-stretch">
      <AttachmentGroup className="max-w-3xl">
        <Attachment>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>report.pdf</AttachmentTitle>
            <AttachmentDescription>1.2 MB · PDF</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove report.pdf">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
          <AttachmentTrigger
            aria-label="Open report.pdf"
            onClick={() => setOpened('report.pdf')}
          />
        </Attachment>
        <Attachment state="uploading" size="sm">
          <AttachmentMedia>
            <Spinner />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>cover.png</AttachmentTitle>
            <AttachmentDescription>Uploading… 42%</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Cancel upload">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state="idle" orientation="vertical">
          <AttachmentMedia>
            <PaperclipIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>notes.txt</AttachmentTitle>
            <AttachmentDescription>idle</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment state="error" size="xs">
          <AttachmentMedia>
            <TriangleAlertIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>archive.zip</AttachmentTitle>
            <AttachmentDescription>Upload failed</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </AttachmentGroup>
      <span className="text-xs text-muted-foreground">
        last opened: {opened ?? '—'}
      </span>
    </Demo>
  )
}

function BubbleDemo() {
  return (
    <Demo label="Bubble" className="items-stretch">
      <BubbleGroup className="max-w-md">
        <Bubble variant="muted" align="start">
          <BubbleContent>Which surface token should a chat bubble use?</BubbleContent>
        </Bubble>
        <Bubble variant="default" align="end">
          <BubbleContent>
            Bubble picks the surface from its variant, so align=&quot;end&quot; just
            flips the side.
          </BubbleContent>
        </Bubble>
        <Bubble variant="tinted" align="start">
          <BubbleContent>variant=&quot;tinted&quot; derives from --primary.</BubbleContent>
        </Bubble>
        <Bubble variant="destructive" align="start">
          <BubbleContent>variant=&quot;destructive&quot; for errors.</BubbleContent>
        </Bubble>
        <Bubble variant="outline" align="start">
          <BubbleContent>variant=&quot;outline&quot;.</BubbleContent>
        </Bubble>
        <Bubble variant="ghost" align="start">
          <BubbleContent>variant=&quot;ghost&quot; has no background at all.</BubbleContent>
        </Bubble>
        <Bubble variant="secondary" align="end">
          <BubbleContent>variant=&quot;secondary&quot;.</BubbleContent>
          <BubbleReactions side="bottom" align="end">
            <span className="text-xs">👍 2</span>
          </BubbleReactions>
        </Bubble>
      </BubbleGroup>
    </Demo>
  )
}

function MessageDemo() {
  return (
    <Demo label="Message" className="items-stretch">
      <MessageGroup className="max-w-xl">
        <Message>
          <MessageAvatar>
            <span className="text-xs">AI</span>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Assistant</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>
                Message composes an avatar, a header, content and a footer.
              </BubbleContent>
            </Bubble>
            <MessageFooter>Delivered</MessageFooter>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageAvatar>
            <span className="text-xs">YU</span>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>You</MessageHeader>
            <Bubble variant="default" align="end">
              <BubbleContent>align=&quot;end&quot; reverses the row.</BubbleContent>
            </Bubble>
            <MessageFooter>Seen</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>
    </Demo>
  )
}

function MessageScrollerStatus({
  onAddMessage,
}: {
  onAddMessage: () => void
}) {
  const { scrollToEnd, scrollToStart } = useMessageScroller()
  const { end } = useMessageScrollerScrollable()
  const { visibleMessageIds } = useMessageScrollerVisibility()

  return (
    <div className="flex items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
      <span>scrollable end: {String(end)}</span>
      <span>· visible items: {visibleMessageIds.length}</span>
      <Button size="xs" variant="outline" className="ml-auto" onClick={onAddMessage}>
        <PlusIcon />
        Add message
      </Button>
      <Button size="xs" variant="ghost" onClick={() => scrollToEnd()}>
        End
      </Button>
      <Button
        size="xs"
        variant="ghost"
        onClick={() => {
          scrollToStart()
        }}
      >
        Start
      </Button>
    </div>
  )
}

function MessageScrollerDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [copied, setCopied] = useState<string | null>(null)

  const lastId = messages[messages.length - 1]?.id ?? null

  return (
    <Demo label="MessageScroller" className="items-stretch">
      <MessageScrollerProvider defaultScrollPosition="end">
        <MessageScroller className="h-96 rounded-xl border">
          <MessageScrollerViewport>
            <MessageScrollerContent>
              <MessageScrollerItem messageId="scroller-intro">
                <Marker variant="separator">
                  <MarkerContent>Today</MarkerContent>
                </Marker>
              </MessageScrollerItem>
              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.id === lastId}
                >
                  <Message align={message.from === 'user' ? 'end' : 'start'}>
                    <MessageAvatar>
                      <span className="text-xs">
                        {message.from === 'user' ? 'YU' : 'AI'}
                      </span>
                    </MessageAvatar>
                    <MessageContent>
                      <MessageHeader>
                        {message.from === 'user' ? 'You' : 'Assistant'}
                      </MessageHeader>
                      <Bubble
                        variant={message.from === 'user' ? 'default' : 'muted'}
                        align={message.from === 'user' ? 'end' : 'start'}
                      >
                        <BubbleContent>{message.text}</BubbleContent>
                        {message.id === 'm-1' ? (
                          <BubbleReactions side="bottom" align="start">
                            <span className="text-xs">👍 1</span>
                          </BubbleReactions>
                        ) : null}
                      </Bubble>
                      <MessageFooter>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setCopied(message.id)}
                        >
                          <CopyIcon />
                          {copied === message.id ? 'Copied' : 'Copy'}
                        </Button>
                      </MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="start" />
          <MessageScrollerButton direction="end" />
          <MessageScrollerStatus
            onAddMessage={() =>
              setMessages((current) => [
                ...current,
                {
                  id: `m-${current.length + 1}`,
                  from: current.length % 2 === 0 ? 'assistant' : 'user',
                  text: `Message #${current.length + 1} added at ${new Date().toLocaleTimeString()}.`,
                },
              ])
            }
          />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <SendIcon className="size-3.5" />
        Items are registered with messageId, so the scroller can jump to any of them
        and track which ones are visible.
      </div>
    </Demo>
  )
}

export function AiSection() {
  return (
    <Section
      title="AI / chat"
      description="MessageScroller, Message, Bubble, Attachment and Marker."
    >
      <MarkerDemo />
      <AttachmentDemo />
      <BubbleDemo />
      <MessageDemo />
      <MessageScrollerDemo />
    </Section>
  )
}
