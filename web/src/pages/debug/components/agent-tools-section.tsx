import { useEffect, useState } from 'react'

import {
  AgentCode,
  AgentCodeLine,
  useAgentCodeTokens,
  type AgentCodeLanguage,
} from '@/components/agents/agent-code'
import { AgentDisclosure } from '@/components/agents/agent-disclosure'
import {
  ApprovalCard,
  type ApprovalCardQuestion,
  type ApprovalCardStatus,
} from '@/components/agents/approval-card'
import {
  Citation,
  CitationFavicon,
  CitationList,
  CitationStack,
  Citations,
  type CitationItem,
} from '@/components/agents/citations'
import { CodeBlock } from '@/components/agents/code-block'
import {
  FileDiff,
  type FileDiffLine,
  type FileDiffStatus,
} from '@/components/agents/file-diff'
import {
  ImageGeneration,
  type ImageGenerationStatus,
} from '@/components/agents/image-generation'
import { TodoList, type TodoItem } from '@/components/agents/todo-list'
import {
  ToolApproval,
  ToolApprovalCode,
  type ToolApprovalStatus,
} from '@/components/agents/tool-approval'
import {
  ToolResult,
  ToolResultOutput,
  type ToolResultStatus,
} from '@/components/agents/tool-result'
import { Button } from '@/components/motion/button'
import { Demo, Section } from '@/pages/debug/components/section'

/**
 * The agent-tool half of the beUI agent set: approvals, todo lists, code and
 * diff rendering, citations and image generation.
 *
 * English and hard-coded on purpose — the debug page is a development tool that
 * gets deleted before release, and is exempt from the i18n rules (see
 * `.claude/rules/frontend.md`).
 *
 * approval-card / tool-approval / todo-list are wired to real state: a demo of
 * an approval card that cannot be approved is not a demo.
 */

/* ── approval-card ─────────────────────────────────────────────────────── */

const APPROVAL_QUESTIONS: ApprovalCardQuestion[] = [
  {
    id: 'target',
    title: 'Which environment should I deploy to?',
    description: 'One answer only — picking one advances to the next question.',
    options: [
      { value: 'staging', label: 'Staging' },
      { value: 'preview', label: 'Preview' },
      { value: 'production', label: 'Production (locked)', disabled: true },
    ],
  },
  {
    id: 'checks',
    title: 'Which checks have to pass first?',
    description: 'Multiple answers are fine here, plus a free-form one.',
    multiple: true,
    allowCustom: true,
    customPlaceholder: 'Add another check…',
    options: [
      { value: 'unit', label: 'Unit tests' },
      { value: 'types', label: 'Typecheck' },
      { value: 'lint', label: 'Lint' },
    ],
  },
]

/* ── tool-result ───────────────────────────────────────────────────────── */

const SEARCH_OUTPUT = `web/src/components/agents/agent-code.tsx:60:export function useAgentCodeTokens(
web/src/components/agents/code-block.tsx:57:  const tokens = useAgentCodeTokens(code, language)
web/src/components/agents/file-diff.tsx:102:  const tokens = useAgentCodeTokens(code, language)`

const REQUEST_FAILURE = `{
  "error": "ECONNREFUSED",
  "host": "127.0.0.1:5107",
  "retries": 3
}`

const MAIN_SNIPPET = `import { createApp } from './app'
import { runNativeHelper } from './native'

const server = createApp().listen(PORT)

runNativeHelper()`

/* ── todo-list ─────────────────────────────────────────────────────────── */

const TODO_TITLES = [
  'Read the failing test',
  'Trace the request through the handler',
  'Patch the service',
  'Run the full suite',
]

function buildTodos(step: number): TodoItem[] {
  const items: TodoItem[] = TODO_TITLES.map((title, index) => ({
    id: `todo-${index}`,
    title,
    status: index < step ? 'completed' : index === step ? 'in-progress' : 'pending',
    progress: index === step ? 24 + step * 18 : undefined,
  }))

  return [
    ...items,
    { id: 'todo-branch', title: 'Delete the scratch branch', status: 'cancelled' },
  ]
}

/* ── code-block ────────────────────────────────────────────────────────── */

const VISIBILITY_SNIPPET = `import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return document.visibilityState === 'visible' && document.hasFocus()
}`

const STREAMING_OUTPUT = `$ bun run typecheck
web/src/pages/debug/theme.tsx(2,31): error TS2307: Cannot find module
  '@/pages/debug/components/agents-section'.
$ bun run lint
Found 0 warnings and 0 errors.`

/* ── agent-code ────────────────────────────────────────────────────────── */

const SHELL_SNIPPET = `bun run --cwd server db:migrate
bun run --cwd web typecheck`

const CONFIG_JSON = `{
  "heartbeatMs": 25000,
  "maxPayloadBytes": 1048576,
  "origins": ["http://localhost:5108"]
}`

/**
 * The lower-level half of `agent-code`: the same shiki tokens, but laid out by
 * hand instead of by `CodeBlock`. This is what a caller writes when the gutter
 * or the row markup has to be its own.
 */
function TokenLines({ code, language }: { code: string; language: AgentCodeLanguage }) {
  const tokens = useAgentCodeTokens(code, language)

  return (
    <div className="font-mono text-xs leading-5">
      {code.split('\n').map((line, index) => (
        <div
          key={`${index}-${line}`}
          className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 rounded-sm px-1 hover:bg-foreground/5"
        >
          <span className="select-none text-right tabular-nums text-muted-foreground/40">
            {index + 1}
          </span>
          <AgentCodeLine
            code={line}
            tokens={tokens?.[index]}
            className="whitespace-pre"
          />
        </div>
      ))}
    </div>
  )
}

/* ── file-diff ─────────────────────────────────────────────────────────── */

const DIFF_LINES: FileDiffLine[] = [
  { id: 'hunk', content: `@@ -14,7 +14,9 @@` },
  {
    id: 'context-set',
    type: 'context',
    oldLine: 14,
    newLine: 14,
    content: `const listeners = new Set<() => void>()`,
  },
  { id: 'blank', type: 'context', oldLine: 15, newLine: 15, content: `` },
  {
    id: 'old-snapshot',
    type: 'removed',
    oldLine: 16,
    content: `export function getSnapshot() {`,
  },
  {
    id: 'old-return',
    type: 'removed',
    oldLine: 17,
    content: `  return document.visibilityState === 'visible'`,
  },
  {
    id: 'new-snapshot',
    type: 'added',
    newLine: 16,
    content: `export function getSnapshot() {`,
  },
  {
    id: 'new-guard',
    type: 'added',
    newLine: 17,
    content: `  if (typeof document === 'undefined') return true`,
  },
  {
    id: 'new-return',
    type: 'added',
    newLine: 18,
    content: `  return document.visibilityState === 'visible' && document.hasFocus()`,
  },
  { id: 'close', type: 'context', oldLine: 18, newLine: 19, content: `}` },
]

const DIFF_PATCH = DIFF_LINES.map((line) =>
  line.type === 'added'
    ? `+${line.content}`
    : line.type === 'removed'
      ? `-${line.content}`
      : ` ${line.content}`,
).join('\n')

/* ── citations ─────────────────────────────────────────────────────────── */

/** Reserved documentation domains — nothing here resolves to a real site. */
const CITATIONS: CitationItem[] = [
  {
    id: 'visibility-state',
    title: 'Document: visibilityState property',
    domain: 'example.com',
    url: 'https://example.com/docs/visibility-state',
  },
  {
    id: 'page-lifecycle',
    title: 'Page Lifecycle API',
    domain: 'example.org',
    url: 'https://example.org/page-lifecycle',
  },
  {
    id: 'sync-external-store',
    title: 'useSyncExternalStore',
    domain: 'example.net',
    url: 'https://example.net/reference/use-sync-external-store',
  },
]

/** The list rows carry `id={prefix}-{citation.id}`, and `Citation` links to that. */
const CITATION_PREFIX = 'debug-citations'

/* ── image-generation ──────────────────────────────────────────────────── */

const IMAGE_STATUSES: ImageGenerationStatus[] = [
  'queued',
  'generating',
  'refining',
  'complete',
  'error',
]

/**
 * A stand-in for a generated image: an inline SVG rather than a hotlinked URL,
 * so the demo has no network dependency (and the colours here are the picture,
 * not component styling).
 */
const GENERATED_ART = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>",
  "<defs><linearGradient id='sky' x1='0' y1='0' x2='1' y2='1'>",
  "<stop offset='0' stop-color='#f97316'/>",
  "<stop offset='0.55' stop-color='#a855f7'/>",
  "<stop offset='1' stop-color='#0ea5e9'/>",
  '</linearGradient></defs>',
  "<rect width='512' height='512' fill='url(#sky)'/>",
  "<circle cx='256' cy='248' r='132' fill='#0b1020' fill-opacity='0.55'/>",
  "<circle cx='256' cy='248' r='132' fill='none' stroke='#ffffff' stroke-opacity='0.6' stroke-width='3'/>",
  "<circle cx='306' cy='206' r='18' fill='#fde68a'/>",
  '</svg>',
].join('')

const GENERATED_IMAGE = `data:image/svg+xml,${encodeURIComponent(GENERATED_ART)}`

export function AgentToolsSection() {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalCardStatus>('pending')
  const [questionsStatus, setQuestionsStatus] = useState<ApprovalCardStatus>('pending')
  const [fileWriteStatus, setFileWriteStatus] = useState<ToolApprovalStatus>('pending')
  const [shellStatus, setShellStatus] = useState<ToolApprovalStatus>('pending')
  const [resultStatus, setResultStatus] = useState<ToolResultStatus>('error')
  const [todoStep, setTodoStep] = useState(0)
  const [todoDone, setTodoDone] = useState(false)
  const [diffStatus, setDiffStatus] = useState<FileDiffStatus>('streaming')
  const [disclosureOpen, setDisclosureOpen] = useState(true)
  const [disclosureFixedOpen, setDisclosureFixedOpen] = useState(false)
  const [imageStatus, setImageStatus] = useState<ImageGenerationStatus>('generating')

  // The two components that own a transient state need someone to leave it.
  useEffect(() => {
    if (questionsStatus !== 'submitting') return

    const timer = window.setTimeout(() => setQuestionsStatus('answered'), 900)
    return () => window.clearTimeout(timer)
  }, [questionsStatus])

  useEffect(() => {
    if (resultStatus !== 'running') return

    const timer = window.setTimeout(() => setResultStatus('success'), 1200)
    return () => window.clearTimeout(timer)
  }, [resultStatus])

  const todos = todoDone
    ? buildTodos(TODO_TITLES.length).map((item) => ({ ...item, status: 'completed' as const }))
    : buildTodos(todoStep)

  return (
    <Section
      title="Agent tools"
      description="The parts an agent transcript is made of: approvals and tool calls, todo lists, code and diff rendering, citations, image generation. Approve, reject, toggle and step through them — the state is real."
    >
      {/* ── approval-card ─────────────────────────────────────────────── */}
      <Demo label="approval-card" height={420} className="p-4">
        <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
          <ApprovalCard
            title="Deploy build 1.4.2 to production?"
            description="This runs the deploy script against the production stack and restarts the service."
            status={approvalStatus}
            approveLabel="Deploy"
            result="Approved — the deploy is queued."
            onApprove={() => setApprovalStatus('approved')}
            onRequestChanges={() => setApprovalStatus('changes-requested')}
            onReject={() => setApprovalStatus('rejected')}
          />

          <ApprovalCard
            title="A couple of questions first"
            questions={APPROVAL_QUESTIONS}
            status={questionsStatus}
            submitLabel="Send answers"
            result="Answers sent — the agent is continuing."
            onSubmit={() => setQuestionsStatus('submitting')}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setApprovalStatus('pending')
                setQuestionsStatus('pending')
              }}
            >
              Reset both
            </Button>
          </div>
        </div>
      </Demo>

      {/* ── tool-approval ─────────────────────────────────────────────── */}
      <Demo label="tool-approval">
        <div className="grid w-full gap-4 xl:grid-cols-2">
          <ToolApproval
            tool="write_file"
            title="Allow this tool to run?"
            description="The agent wants to overwrite a file that is already in the repo."
            status={fileWriteStatus}
            defaultOpen
            parameters={[
              { id: 'path', label: 'Path', value: 'server/src/main.ts' },
              { id: 'mode', label: 'Mode', value: 'overwrite' },
              { id: 'bytes', label: 'Bytes', value: '1 284' },
            ]}
            onApprove={() => setFileWriteStatus('approved')}
            onAlwaysAllow={() => setFileWriteStatus('approved')}
            onDeny={() => setFileWriteStatus('denied')}
          />

          <ToolApproval
            tool="run_shell"
            title="A terminal command needs approval"
            description="Parameter values rendered with ToolApprovalCode, which wraps the same line renderer the code block uses."
            status={shellStatus}
            defaultOpen
            parameters={[
              {
                id: 'command',
                label: 'Command',
                value: <ToolApprovalCode code="bun run --cwd server db:migrate" />,
              },
              {
                id: 'env',
                label: 'Env',
                value: <ToolApprovalCode language="json" code={CONFIG_JSON} />,
              },
            ]}
            onApprove={() => setShellStatus('running')}
            onDeny={() => setShellStatus('denied')}
          />
        </div>
      </Demo>

      {/* ── tool-result ───────────────────────────────────────────────── */}
      <Demo label="tool-result">
        <div className="flex w-full max-w-3xl flex-col gap-5">
          <ToolResult
            tool="grep_search"
            title="Search the repo for useAgentCodeTokens"
            status="success"
            kind="terminal"
            meta="312 ms · 3 matches"
            copyText={SEARCH_OUTPUT}
          >
            <ToolResultOutput language="bash">{SEARCH_OUTPUT}</ToolResultOutput>
          </ToolResult>

          <ToolResult
            tool="http_request"
            title="POST /api/auth/login"
            status={resultStatus}
            kind="request"
            meta="502 · upstream refused"
            copyText={REQUEST_FAILURE}
            onRetry={() => setResultStatus('running')}
          >
            <ToolResultOutput language="json">{REQUEST_FAILURE}</ToolResultOutput>
          </ToolResult>

          <ToolResult
            tool="read_file"
            title="Reading server/src/main.ts"
            status="running"
            kind="terminal"
            meta="streaming"
            maxHeight={140}
          >
            <ToolResultOutput language="typescript">{MAIN_SNIPPET}</ToolResultOutput>
          </ToolResult>
        </div>
      </Demo>

      {/* ── todo-list ─────────────────────────────────────────────────── */}
      <Demo label="todo-list" height={420} className="p-4">
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={todoDone || todoStep >= TODO_TITLES.length}
              onClick={() => setTodoStep((step) => step + 1)}
            >
              Next step
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTodoDone(true)}>
              Complete all
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setTodoStep(0)
                setTodoDone(false)
              }}
            >
              Reset
            </Button>
          </div>

          <TodoList items={todos} title="Refactor the auth guard" />
        </div>
      </Demo>

      {/* ── code-block ────────────────────────────────────────────────── */}
      <Demo label="code-block">
        <div className="flex w-full max-w-3xl flex-col gap-4">
          <CodeBlock
            code={VISIBILITY_SNIPPET}
            language="typescript"
            filename="web/src/hooks/use-page-visibility-store.ts"
            highlightLines={[10, 11]}
          />

          <CodeBlock
            code={STREAMING_OUTPUT}
            language="bash"
            filename="terminal"
            status="streaming"
            showLineNumbers={false}
            copyable={false}
          />
        </div>
      </Demo>

      {/* ── agent-code ────────────────────────────────────────────────── */}
      <Demo label="agent-code">
        <div className="flex w-full max-w-3xl flex-col gap-4">
          <div
            // frosted blur hook
            data-slot="demo-panel"
            className="rounded-xl border border-border/60 bg-muted/40 p-3"
          >
            <p className="mb-2 text-xs text-muted-foreground">
              AgentCode — one `pre`, no gutter, no chrome.
            </p>
            <AgentCode code={SHELL_SNIPPET} language="bash" />
          </div>

          <div
            // frosted blur hook
            data-slot="demo-panel"
            className="rounded-xl border border-border/60 bg-muted/40 p-3"
          >
            <p className="mb-2 text-xs text-muted-foreground">
              useAgentCodeTokens + AgentCodeLine — the same tokens, with a gutter of my
              own.
            </p>
            <TokenLines code={CONFIG_JSON} language="json" />
          </div>
        </div>
      </Demo>

      {/* ── agent-disclosure ──────────────────────────────────────────── */}
      <Demo label="agent-disclosure">
        <div className="flex w-full max-w-3xl flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDisclosureOpen((open) => !open)}>
              {disclosureOpen ? 'Collapse' : 'Expand'} auto height
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDisclosureFixedOpen((open) => !open)}
            >
              {disclosureFixedOpen ? 'Collapse' : 'Expand'} fixed height
            </Button>
          </div>

          {/* 底色搬到了外层：`AgentDisclosure` 自己必须留 `data-slot="agent-disclosure"`
              （上面的 clip-path 规则认它），一个元素只能有一个 data-slot。 */}
          <div
            // frosted blur hook
            data-slot="demo-panel"
            className="rounded-xl border border-border/60 bg-muted/40"
          >
            <AgentDisclosure open={disclosureOpen}>
              <p className="p-3 text-sm leading-5 text-muted-foreground">
                The reveal itself is the whole component: it animates opacity, a
                clip-path wipe and a small offset, and it never measures the content —
                openHeight defaults to auto, so the height is whatever the children
                need. While closed it also carries `inert` and `aria-hidden`, so the
                hidden content cannot be tabbed into or read out.
              </p>
            </AgentDisclosure>
          </div>

          <div
            // frosted blur hook
            data-slot="demo-panel"
            className="rounded-xl border border-border/60 bg-muted/40"
          >
            <AgentDisclosure open={disclosureFixedOpen} openHeight={96}>
              <div className="h-full overflow-y-auto p-3 text-sm leading-5 text-muted-foreground">
                Pass openHeight when the region has to be a fixed size instead —
                tool output, a log, anything that scrolls. Here it is 96px, and the
                paragraph inside is taller than that, so it scrolls. The disclosure
                still clips the whole region on the way in and out, which is the
                difference between this and a plain conditional render: the box grows
                and shrinks rather than popping in.
              </div>
            </AgentDisclosure>
          </div>
        </div>
      </Demo>

      {/* ── file-diff ─────────────────────────────────────────────────── */}
      <Demo label="file-diff" height={420} className="p-4">
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {(['streaming', 'complete'] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={diffStatus === value ? 'primary' : 'outline'}
                onClick={() => setDiffStatus(value)}
              >
                {value}
              </Button>
            ))}
            <span className="self-center text-xs text-muted-foreground">
              streaming → complete collapses the diff (collapseOnComplete)
            </span>
          </div>

          <FileDiff
            file="web/src/hooks/use-page-visibility.ts"
            lines={DIFF_LINES}
            status={diffStatus}
            language="typescript"
            maxHeight={240}
            copyText={DIFF_PATCH}
          />
        </div>
      </Demo>

      {/* ── citations ─────────────────────────────────────────────────── */}
      <Demo label="citations">
        <div className="flex w-full max-w-2xl flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <CitationStack citations={CITATIONS} />
            <span className="text-sm text-muted-foreground">
              CitationStack, then a lone CitationFavicon
            </span>
            <CitationFavicon
              url="https://example.com/docs/visibility-state"
              className="size-6 rounded-full bg-background"
            />
          </div>

          <p className="text-sm leading-6 text-foreground/85">
            Inline markers in the prose
            <Citation
              citationId="visibility-state"
              index={1}
              idPrefix={CITATION_PREFIX}
            />
            are just anchor links into the list below
            <Citation
              citationId="sync-external-store"
              index={3}
              idPrefix={CITATION_PREFIX}
            />
            , which is why the two have to share an idPrefix.
          </p>

          <Citations citations={CITATIONS} idPrefix={CITATION_PREFIX} defaultOpen />

          <div
            // frosted blur hook
            data-slot="demo-panel"
            className="rounded-xl border border-border/60 bg-muted/40 p-3"
          >
            <CitationList
              citations={CITATIONS.slice(0, 2)}
              idPrefix="debug-citations-plain"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            The favicons come from `lib/favicon.ts`, which just asks the origin for
            /favicon.ico — the domains here are the reserved example.* ones, so the
            icons fail to load and fall back to the globe glyph.
          </p>
        </div>
      </Demo>

      {/* ── image-generation ──────────────────────────────────────────── */}
      <Demo label="image-generation" height={420} className="p-4">
        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {IMAGE_STATUSES.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={imageStatus === value ? 'primary' : 'outline'}
                onClick={() => setImageStatus(value)}
              >
                {value}
              </Button>
            ))}
          </div>

          <ImageGeneration
            status={imageStatus}
            prompt="A dithered orb over a warm gradient"
            resolution="1024 × 1024"
            onRetry={() => setImageStatus('generating')}
          >
            <img src={GENERATED_IMAGE} alt="" />
          </ImageGeneration>

          <p className="max-w-md text-xs text-muted-foreground">
            The media is resized, blurred and faded per status while the canvas
            dither field fades out on top of it; error reveals the retry button.
          </p>
        </div>
      </Demo>
    </Section>
  )
}
