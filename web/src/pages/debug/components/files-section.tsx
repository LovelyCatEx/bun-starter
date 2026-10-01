import { useEffect, useState } from 'react'

import {
  AttachmentUpload,
  type AttachmentUploadItem,
} from '@/components/motion/attachment-upload'
import { Button } from '@/components/motion/button'
import { FileUpload, type FileUploadItem } from '@/components/motion/file-upload'
import { Demo, Section } from '@/pages/debug/components/section'

/**
 * English and hard-coded on purpose — the debug page is exempt from the i18n rules
 * (see `.claude/rules/frontend.md`).
 */

/** Inline preview so the image row has something to show without a network or a real file. */
const PREVIEW_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='160' height='160' fill='#818cf8'/><circle cx='80' cy='62' r='28' fill='#f8fafc'/><path d='M22 142l42-48 28 32 26-22 20 38z' fill='#f8fafc' opacity='.85'/></svg>",
)}`

/** One of each kind, plus a failed row so the retry affordance is on screen from the start. */
const SEED_ATTACHMENTS: AttachmentUploadItem[] = [
  {
    id: 'seed-image',
    name: 'floor-plan.svg',
    kind: 'image',
    size: 24600,
    previewUrl: PREVIEW_IMAGE,
    href: PREVIEW_IMAGE,
  },
  {
    id: 'seed-link',
    name: 'Design spec',
    kind: 'link',
    href: 'https://example.com/design-spec',
  },
  {
    id: 'seed-audio',
    name: 'standup-2026-09-28.m4a',
    kind: 'audio',
    size: 1820000,
    currentTime: 86,
    duration: 214,
  },
  {
    id: 'seed-failed',
    name: 'offsite-backup.zip',
    kind: 'file',
    size: 8400000,
    status: 'failed',
    error: 'Object storage rejected the chunk',
  },
]

/** How much progress one tick adds — 9% at 180ms is roughly a 2s upload. */
const PROGRESS_STEP = 9
const PROGRESS_TICK_MS = 180

export function FilesSection() {
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [attachments, setAttachments] = useState<AttachmentUploadItem[]>(SEED_ATTACHMENTS)
  const [playingId, setPlayingId] = useState<string | undefined>(undefined)
  const [events, setEvents] = useState<string[]>([])

  const uploading = files.some((file) => file.status === 'uploading')

  useEffect(() => {
    if (!uploading) return
    const timer = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.status !== 'uploading') return file
          const progress = Math.min(100, (file.progress ?? 0) + PROGRESS_STEP)
          return {
            ...file,
            progress,
            status: progress >= 100 ? 'success' : 'uploading',
          }
        }),
      )
    }, PROGRESS_TICK_MS)
    return () => clearInterval(timer)
  }, [uploading])

  const record = (message: string) => {
    setEvents((prev) => [message, ...prev].slice(0, 5))
  }

  const failNextFile = () => {
    setFiles((prev) => {
      const index = prev.findIndex((file) => file.status === 'uploading')
      if (index === -1) return prev
      return prev.map((file, at) =>
        at === index
          ? { ...file, status: 'error' as const, error: 'Simulated connection drop' }
          : file,
      )
    })
  }

  return (
    <Section
      title="Files & upload"
      description="Two drop zones: a file queue with per-row progress, and an attachment composer that also takes links, images and audio. Everything below is your state — the components never upload anything themselves."
    >
      <Demo label="file-upload" height={420}>
        <div className="h-full w-full overflow-y-auto p-3">
          <FileUpload
            value={files}
            onValueChange={setFiles}
            accept="image/*,application/pdf"
            maxFiles={4}
            title="Drop receipts here"
            description="Images and PDFs, up to four at a time"
            browseLabel="Browse"
            onFilesAdded={(added) => record(`Queued ${added.length} file(s)`)}
            onRemove={(item) => record(`Removed ${item.name}`)}
            onRetry={(item) => record(`Retried ${item.name}`)}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={failNextFile} disabled={!uploading}>
              Fail the uploading row
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFiles([])}>
              Clear the queue
            </Button>
            <span className="text-xs text-muted-foreground">
              {files.length} of 4 slots used
            </span>
          </div>

          <p className="mt-3 max-w-2xl text-xs text-muted-foreground">
            Rows arrive as `uploading` the moment a file is picked or dropped, so the demo advances
            `progress` on a timer and flips them to `success` — that part is the app&apos;s job, not
            the component&apos;s. Fail a row to see the error tone and the retry button: retrying
            puts it straight back to `uploading` and the timer picks it up again. `variant="centered"`
            swaps the wide row for a tall centred card, `maxFiles` turns the zone into the
            limit-reached state.
          </p>

          {events.length === 0 ? null : (
            <ul className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
              {events.map((event, index) => (
                <li key={`${event}-${index}`} className="tabular-nums">
                  {event}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Demo>

      <Demo label="attachment-upload" height={420}>
        <div className="h-full w-full overflow-y-auto p-3">
          <AttachmentUpload
            value={attachments}
            onValueChange={setAttachments}
            accept="image/*,audio/*,application/pdf"
            maxFiles={6}
            maxFileSize={2 * 1024 * 1024}
            title="Drag and drop or browse files"
            description="Images, audio and PDFs up to 2 MB, six in total"
            attachmentsLabel="Attachments"
            playingId={playingId}
            onAudioToggle={(item) =>
              setPlayingId((current) => (current === item.id ? undefined : item.id))
            }
            onFilesAdded={(added) => record(`Attachment added: ${added.length} file(s)`)}
            onFilesRejected={(rejected, reason) =>
              record(`Rejected ${rejected.length} file(s) — ${reason}`)
            }
            onRemove={(item) => record(`Removed ${item.name}`)}
            // The component does not clear a failed seed by itself: retry is your callback.
            onRetry={(item) => {
              setAttachments((prev) =>
                prev.map((entry) =>
                  entry.id === item.id ? { ...entry, status: 'complete', error: undefined } : entry,
                ),
              )
              record(`Retried ${item.name}`)
            }}
          />

          <p className="mt-3 max-w-2xl text-xs text-muted-foreground">
            Seeded with one of each kind: the image thumbnail opens a full-screen preview (with a
            shared-layout morph), the link row gets an open-in-new-tab button, and the audio row
            draws a waveform with play/pause wired to `playingId` + `onAudioToggle`. Drop something
            in to watch the built-in lifecycle — the row uploads, holds a check, then clears.
            `maxFileSize` here is 2 MB, so a bigger file shows up as a rejection instead of a row.
          </p>

          {events.length === 0 ? null : (
            <ul className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
              {events.map((event, index) => (
                <li key={`${event}-${index}`}>
                  {event}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Demo>
    </Section>
  )
}
