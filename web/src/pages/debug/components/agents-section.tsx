import { PanelLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AgentActivity, type AgentActivityItem } from '@/components/agents/agent-activity'
import { AISidebar, type SidebarResource } from '@/components/agents/ai-sidebar'
import { ChatApp } from '@/components/agents/chat-app'
import type { CitationItem } from '@/components/agents/citations'
import { AgentProgress } from '@/components/agents/loading-states/agent-progress'
import {
  ReasoningText,
  type ReasoningTextVariant,
} from '@/components/agents/loading-states/reasoning-text'
import { ThinkingShimmer } from '@/components/agents/loading-states/thinking-shimmer'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
  MessageMarker,
  MessageTyping,
  type MessageFrom,
} from '@/components/agents/message'
import {
  MessageBubble,
  MessageBubbleCollapsible,
  MessageBubbleContent,
  MessageBubbleGroup,
  type MessageBubbleVariant,
} from '@/components/agents/message-bubble'
import { MessageSideContext, type MessageSide } from '@/components/agents/message-context'
import { MessageScroller } from '@/components/agents/message-scroller'
import {
  PromptInput,
  type PromptAction,
  type PromptModel,
} from '@/components/agents/prompt-input'
import {
  StreamingResponse,
  type StreamingResponseFeedback,
} from '@/components/agents/streaming-response'
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarHeader,
  AnimatedSidebarInset,
  AnimatedSidebarTrigger,
} from '@/components/motion/animated-sidebar'
import { Button } from '@/components/motion/button'
import { Demo, Section } from '@/pages/debug/components/section'

interface ThreadMessage {
  id: string
  from: MessageFrom
  text: string
}

const CHAT_THREADS = ['Release checklist', 'Migration plan', 'Bundle size audit']

const CHAT_SEED: ThreadMessage[] = [
  { id: 'c1', from: 'user', text: 'Outline the release checklist for the desktop build.' },
  {
    id: 'c2',
    from: 'assistant',
    text: 'Bundle the frontend, cross-compile all five targets, then boot the produced binary on a machine with no Bun installed.',
  },
]

const MESSAGE_VARIANTS: MessageBubbleVariant[] = [
  'solid',
  'soft',
  'tint',
  'outline',
  'ghost',
  'danger',
]

const COLLAPSIBLE_TEXT =
  'The transcript is anchored to the live edge while the agent is still writing. Move the viewport away from the bottom and the scroller stops following, so a reader who went back to check an earlier answer is never yanked forward again. Returning to the bottom resumes following, and the rail on the right gives every rendered message a tick you can jump to.'

const TRANSCRIPT: ThreadMessage[] = [
  { id: 't1', from: 'user', text: 'Sketch a release checklist for the desktop build.' },
  {
    id: 't2',
    from: 'assistant',
    text: 'Starting from the compile step: build the frontend first, then cross-compile the server for every target.',
  },
  { id: 't3', from: 'user', text: 'What about the native helpers?' },
  {
    id: 't4',
    from: 'assistant',
    text: 'They are compiled per target too — clang on macOS, zig everywhere else — and then embedded as assets.',
  },
  { id: 't5', from: 'user', text: 'And migrations?' },
  {
    id: 't6',
    from: 'assistant',
    text: 'The drizzle folder is carried inside the binary, so the produced executable migrates its own database on boot.',
  },
  { id: 't7', from: 'user', text: 'Does anything need the source tree at runtime?' },
  {
    id: 't8',
    from: 'assistant',
    text: 'No. The frontend, the migrations and the helpers are all inside the single file, so the binary stands alone.',
  },
]

const ACTIVITY_ITEMS: AgentActivityItem[] = [
  { id: 'a1', type: 'text', content: 'Planning the release checklist before touching any file.' },
  {
    id: 'a2',
    type: 'search',
    query: 'bun build --compile cross target flags',
    results: [
      { id: 'r1', title: 'Single-file executables', domain: 'bun.sh', url: 'https://bun.sh/docs/bundler/executables' },
      { id: 'r2', title: 'Cross-compilation targets', domain: 'ziglang.org' },
    ],
    moreCount: 3,
  },
  { id: 'a3', type: 'tool', action: 'read', target: 'scripts/build-targets.ts' },
  { id: 'a4', type: 'step', label: 'Collect the five targets', status: 'complete', meta: '184ms' },
  {
    id: 'a5',
    type: 'tool',
    action: 'edit',
    target: 'scripts/compile.ts',
    additions: 24,
    deletions: 6,
  },
  { id: 'a6', type: 'trace', kind: 'run', label: 'Run', detail: 'bun run typecheck' },
  { id: 'a7', type: 'step', label: 'Publish the checklist', status: 'complete', meta: '1.2s' },
]

const PROMPT_MODELS: PromptModel[] = [
  { value: 'fast', label: 'Fast' },
  { value: 'reasoning', label: 'Reasoning' },
]

const PROMPT_ACTIONS: PromptAction[] = [
  { value: 'attach', label: 'Attach a file', description: 'Add a document to the prompt' },
  { value: 'search', label: 'Search the web', description: 'Let the agent browse before answering' },
]

const RESPONSE_TEXT =
  'Here is the order I would ship in. First the bundle: the frontend builds to dist/, and every server target is compiled with `bun build --compile`, so the executable carries the assets, the Drizzle migrations and the native helpers. Second the native pass: each platform gets its own helper built from server/native, macOS through clang and the rest through zig. Third the sanity check: boot the produced binary somewhere with no Bun installed and confirm the migrations run before the first request.'

const RESPONSE_SOURCES: CitationItem[] = [
  { id: 's1', title: 'Single-file executables', domain: 'bun.sh', url: 'https://bun.sh/docs/bundler/executables' },
  { id: 's2', title: 'Drizzle Kit migrations', domain: 'orm.drizzle.team', url: 'https://orm.drizzle.team/docs/migrations' },
]

const SIDEBAR_ITEMS: SidebarResource[] = [
  { id: 'brief', label: 'Product brief', kind: 'file' },
  {
    id: 'research',
    label: 'Research',
    kind: 'folder',
    children: [
      { id: 'competitors', label: 'Competitors', kind: 'file' },
      { id: 'interviews', label: 'Interview notes', kind: 'file' },
      { id: 'archive', label: 'Archive', kind: 'file', disabled: true },
    ],
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    kind: 'project',
    children: [{ id: 'shipping', label: 'Shipping plan', kind: 'file' }],
  },
  { id: 'launch', label: 'Launch notes', kind: 'bookmark' },
]

const SHIMMER_LABELS = [
  'Thinking…',
  'Searching the web…',
  'Reading 4 files…',
  'Writing the checklist…',
]

const REASONING_PHRASES = [
  'Thinking',
  'Reading the compile script',
  'Connecting the targets',
  'Forming a checklist',
]

const REASONING_VARIANTS: ReasoningTextVariant[] = ['cascade', 'swap', 'scramble']

/** 一条消息行：`Message` 的八件套里最常用的四个，外加气泡。列表里到处都用它。 */
function ThreadRow({ message }: { message: ThreadMessage }) {
  const from = message.from

  return (
    <Message from={from}>
      <MessageAvatar>{from === 'user' ? 'Y' : 'AI'}</MessageAvatar>
      <MessageContent>
        <MessageBubble variant={from === 'user' ? 'solid' : 'soft'}>
          <MessageBubbleContent>{message.text}</MessageBubbleContent>
        </MessageBubble>
      </MessageContent>
    </Message>
  )
}

export function AgentsSection() {
  const [side, setSide] = useState<MessageSide>('start')
  const [promptValue, setPromptValue] = useState('')
  const [promptModel, setPromptModel] = useState(PROMPT_MODELS[0].value)
  const [promptLoading, setPromptLoading] = useState(false)
  const [sentPrompts, setSentPrompts] = useState<string[]>([])
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [streamed, setStreamed] = useState('')
  const [feedback, setFeedback] = useState<StreamingResponseFeedback>(null)
  const [following, setFollowing] = useState(true)
  const [activityCount, setActivityCount] = useState(1)
  const [shimmerStep, setShimmerStep] = useState(0)
  const [sidebarItems, setSidebarItems] = useState(SIDEBAR_ITEMS)
  const [sidebarActiveId, setSidebarActiveId] = useState<string | null>('brief')
  const [sidebarNotice, setSidebarNotice] = useState('Pick a row to make it active.')
  const [activeThread, setActiveThread] = useState(CHAT_THREADS[0])
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>(CHAT_SEED)
  const scrollerRef = useRef<HTMLElement>(null)
  const replyTimer = useRef<number | undefined>(undefined)

  const streaming = streamed.length < RESPONSE_TEXT.length
  const sourceCount = ACTIVITY_ITEMS.length

  // streaming-response 不收流，只收已经拿到的文本；这个 effect 就是那条流。
  useEffect(() => {
    if (streamed.length >= RESPONSE_TEXT.length) return
    const timer = window.setTimeout(() => {
      setStreamed(RESPONSE_TEXT.slice(0, streamed.length + 4))
    }, 45)
    return () => window.clearTimeout(timer)
  }, [streamed])

  // agent-activity 也收现成的数组，这里一条一条往外放。
  useEffect(() => {
    if (activityCount >= sourceCount) return
    const timer = window.setTimeout(() => setActivityCount((count) => count + 1), 900)
    return () => window.clearTimeout(timer)
  }, [activityCount, sourceCount])

  // 让发送按钮真的有一段时间是"停止"。
  useEffect(() => {
    if (!promptLoading) return
    const timer = window.setTimeout(() => setPromptLoading(false), 1400)
    return () => window.clearTimeout(timer)
  }, [promptLoading])

  useEffect(
    () => () => {
      if (replyTimer.current) window.clearTimeout(replyTimer.current)
    },
    [],
  )

  const sendChatMessage = (value: string) => {
    setThreadMessages((current) => [
      ...current,
      { id: `m-${Date.now()}-u`, from: 'user', text: value },
    ])
    if (replyTimer.current) window.clearTimeout(replyTimer.current)
    replyTimer.current = window.setTimeout(() => {
      setThreadMessages((current) => [
        ...current,
        {
          id: `m-${Date.now()}-a`,
          from: 'assistant',
          text: `Queued “${value}” on the ${activeThread} thread.`,
        },
      ])
    }, 700)
  }

  const jumpToEnd = () => {
    const viewport = scrollerRef.current
    if (!viewport) return
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
  }

  return (
    <Section
      title="Agent & chat"
      description="beUI 的 agent / chat 系列。chat-app 与 ai-sidebar 是整块应用，只在定高块里跑；小的那一批（message、message-bubble、agent-progress…）横排即可。"
    >
      {/* ── 两块"整应用"，必须有 height ─────────────────────────── */}

      <Demo label="chat-app" height={520}>
        <ChatApp className="h-full" sidebarWidth="14rem">
          <AnimatedSidebar collapsible="none">
            <AnimatedSidebarHeader>
              <span className="px-2 pt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Threads
              </span>
            </AnimatedSidebarHeader>
            <AnimatedSidebarContent>
              {CHAT_THREADS.map((thread) => (
                <Button
                  key={thread}
                  variant={thread === activeThread ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveThread(thread)}
                >
                  {thread}
                </Button>
              ))}
            </AnimatedSidebarContent>
            <AnimatedSidebarFooter>
              <span className="px-2 text-xs text-muted-foreground">
                {CHAT_THREADS.length} threads · 1 agent
              </span>
            </AnimatedSidebarFooter>
          </AnimatedSidebar>

          <AnimatedSidebarInset className="min-h-0">
            <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
              <AnimatedSidebarTrigger aria-label="Toggle threads">
                <PanelLeft className="size-4" />
              </AnimatedSidebarTrigger>
              <span className="truncate text-sm font-medium">{activeThread}</span>
            </header>

            <MessageScroller
              label={`${activeThread} transcript`}
              className="min-h-0 flex-1"
              contentClassName="flex flex-col gap-4 px-4 py-3"
            >
              {threadMessages.map((message) => (
                <ThreadRow key={message.id} message={message} />
              ))}
            </MessageScroller>

            <div className="shrink-0 border-t border-border p-3">
              <PromptInput
                placeholder="Ask about this thread…"
                models={PROMPT_MODELS}
                minRows={1}
                maxRows={4}
                onSubmit={sendChatMessage}
              />
            </div>
          </AnimatedSidebarInset>
        </ChatApp>
      </Demo>

      <Demo label="ai-sidebar" height={440}>
        <div className="flex h-full w-full gap-6 p-4">
          <div className="h-full w-72 min-w-0 overflow-y-auto rounded-xl border border-border p-2">
            <AISidebar
              items={sidebarItems}
              onItemsChange={setSidebarItems}
              activeId={sidebarActiveId}
              onActiveChange={setSidebarActiveId}
              defaultExpandedIds={['research']}
              onMove={async (move) => {
                await new Promise((resolve) => window.setTimeout(resolve, 350))
                setSidebarNotice(
                  `Moved ${move.itemId} ${move.position} ${move.targetId ?? 'the top level'}.`,
                )
              }}
              onRename={async (item, label) => {
                await new Promise((resolve) => window.setTimeout(resolve, 250))
                setSidebarNotice(`Renamed ${item.label} to ${label}.`)
              }}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium">Active: {sidebarActiveId ?? 'none'}</span>
            <p className="text-xs text-muted-foreground">{sidebarNotice}</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Drag a row onto another, or open the row menu for rename / move. Keyboard:
              Alt+Shift+Arrow moves the focused row, F2 renames, Arrow keys walk the tree.
            </p>
          </div>
        </div>
      </Demo>

      {/* ── 消息原语 ─────────────────────────────────────────────── */}

      <Demo label="message">
        <div className="w-full max-w-2xl">
          <MessageGroup>
            <Message from="user">
              <MessageAvatar>Y</MessageAvatar>
              <MessageContent>
                <MessageHeader>You · 12:04</MessageHeader>
                <MessageBubble variant="solid">
                  <MessageBubbleContent>Ship the checklist as a comment.</MessageBubbleContent>
                </MessageBubble>
                <MessageFooter>Delivered</MessageFooter>
              </MessageContent>
            </Message>

            <MessageMarker>Today</MessageMarker>

            <Message from="assistant">
              <MessageAvatar>AI</MessageAvatar>
              <MessageContent>
                <MessageHeader>Agent · 12:04</MessageHeader>
                <MessageBubble>
                  <MessageBubbleContent>Writing it up now.</MessageBubbleContent>
                </MessageBubble>
                <MessageFooter>
                  <MessageTyping label="Responding" />
                </MessageFooter>
              </MessageContent>
            </Message>

            <Message from="assistant">
              <MessageAvatar placeholder />
              <MessageContent>
                <MessageBubble>
                  <MessageBubbleContent>
                    Second reply in the same group — the invisible placeholder avatar keeps it
                    aligned with the row above.
                  </MessageBubbleContent>
                </MessageBubble>
              </MessageContent>
            </Message>
          </MessageGroup>
          <p className="mt-3 text-xs text-muted-foreground">
            `MessageGroup` spaces the rows, `MessageMarker` is the centred divider, and
            `MessageAvatar placeholder` reserves the avatar slot without drawing anything.
          </p>
        </div>
      </Demo>

      <Demo label="message-bubble">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <MessageBubbleGroup>
            {MESSAGE_VARIANTS.map((variant) => (
              <MessageBubble key={variant} variant={variant}>
                <MessageBubbleContent>{variant}</MessageBubbleContent>
              </MessageBubble>
            ))}
          </MessageBubbleGroup>

          <MessageBubble align="end" variant="outline">
            <MessageBubbleContent
              render={<button type="button" />}
              onClick={() => setLastAction('Opened the outline bubble.')}
            >
              Rendered as a button — hover, focus and press states come from the bubble.
            </MessageBubbleContent>
          </MessageBubble>

          <MessageBubble variant="outline">
            <MessageBubbleContent>
              <MessageBubbleCollapsible collapsedLines={3}>
                {COLLAPSIBLE_TEXT}
              </MessageBubbleCollapsible>
            </MessageBubbleContent>
          </MessageBubble>

          <span className="text-xs text-muted-foreground">
            {lastAction ?? 'Click the outlined bubble above.'}
          </span>
        </div>
      </Demo>

      <Demo label="message-scroller" height={340}>
        <div className="flex h-full w-full flex-col gap-2 p-3">
          <div className="flex shrink-0 items-center gap-3">
            <Button size="sm" variant="outline" onClick={jumpToEnd}>
              Jump to end
            </Button>
            <span className="text-xs text-muted-foreground">
              {following ? 'Following the live edge' : 'Reading history — following paused'}
            </span>
          </div>
          <MessageScroller
            viewportRef={scrollerRef}
            navigation="rail"
            label="Transcript"
            onFollowChange={setFollowing}
            className="min-h-0 flex-1"
            contentClassName="flex flex-col gap-4 px-1 py-3"
          >
            {TRANSCRIPT.map((message) => (
              <ThreadRow key={message.id} message={message} />
            ))}
          </MessageScroller>
        </div>
      </Demo>

      <Demo label="message-context">
        <div className="flex w-full max-w-2xl flex-col gap-3">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSide(side === 'start' ? 'end' : 'start')}
            >
              Flip side
            </Button>
            <span className="text-xs text-muted-foreground">
              MessageSideContext = {side} — MessageBubble inherits it when `align` is omitted.
            </span>
          </div>
          <MessageSideContext.Provider value={side}>
            <MessageBubble>
              <MessageBubbleContent>Aligned by the surrounding context.</MessageBubbleContent>
            </MessageBubble>
          </MessageSideContext.Provider>
        </div>
      </Demo>

      {/* ── 输入与输出 ───────────────────────────────────────────── */}

      <Demo label="prompt-input">
        <div className="flex w-full max-w-2xl flex-col gap-3">
          <PromptInput
            value={promptValue}
            onValueChange={setPromptValue}
            models={PROMPT_MODELS}
            model={promptModel}
            onModelChange={setPromptModel}
            actions={PROMPT_ACTIONS}
            onAction={(action) => setLastAction(`Action: ${action}`)}
            loading={promptLoading}
            onStop={() => setPromptLoading(false)}
            onSubmit={(value) => {
              setSentPrompts((current) => [...current, `${value}  ·  ${promptModel}`])
              setPromptValue('')
              setPromptLoading(true)
            }}
          />
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{promptValue.length} characters typed</span>
            <span>{lastAction ?? 'no action picked yet'}</span>
          </div>
          {sentPrompts.length ? (
            <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
              {sentPrompts.map((item, index) => (
                <li key={`${item}-${index}`} className="truncate">
                  Sent: {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Enter sends, Shift+Enter adds a line, and the send button turns into a stop button
              while `loading` is on.
            </p>
          )}
        </div>
      </Demo>

      <Demo label="streaming-response">
        <div className="w-full max-w-2xl rounded-2xl border border-border p-4">
          <StreamingResponse
            status={streaming ? 'streaming' : 'complete'}
            copyText={RESPONSE_TEXT}
            onRetry={() => setStreamed('')}
            sources={RESPONSE_SOURCES}
            feedback={feedback}
            onFeedbackChange={setFeedback}
          >
            {streamed}
          </StreamingResponse>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setStreamed('')}>
              Replay stream
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {streamed.length} / {RESPONSE_TEXT.length} characters
            </span>
            <span className="text-xs text-muted-foreground">
              feedback: {feedback ?? 'none'}
            </span>
          </div>
        </div>
      </Demo>

      {/* ── 运行状态 ─────────────────────────────────────────────── */}

      <Demo label="agent-activity">
        <div className="w-full max-w-2xl rounded-xl border border-border p-3">
          <AgentActivity
            items={ACTIVITY_ITEMS.slice(0, activityCount)}
            status={activityCount >= sourceCount ? 'complete' : 'working'}
            duration={activityCount * 2.4}
            defaultOpen
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setActivityCount(1)}>
              Replay run
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {activityCount} of {sourceCount} steps streamed
            </span>
          </div>
        </div>
      </Demo>

      <Demo label="agent-progress">
        <AgentProgress label="Churning" initialSeconds={12} />
        <AgentProgress label="Verifying" elapsedSeconds={42.5} running={false} />
      </Demo>

      <Demo label="thinking-shimmer">
        <ThinkingShimmer>{SHIMMER_LABELS[shimmerStep]}</ThinkingShimmer>
        <ThinkingShimmer duration={3.4}>Indexing the repository…</ThinkingShimmer>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShimmerStep((step) => (step + 1) % SHIMMER_LABELS.length)}
        >
          Next label
        </Button>
      </Demo>

      <Demo label="reasoning-text">
        <div className="flex w-full max-w-2xl flex-col gap-3">
          {REASONING_VARIANTS.map((variant) => (
            <div key={variant} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">{variant}</span>
              <ReasoningText variant={variant} phrases={REASONING_PHRASES} />
            </div>
          ))}
        </div>
      </Demo>
    </Section>
  )
}
