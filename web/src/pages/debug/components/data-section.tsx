import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/motion/button'
import { Table, type TableColumn } from '@/components/motion/table'
import { Demo, Section } from '@/pages/debug/components/section'

/**
 * `Table` once, three ways. The registry ships the same component under `table`, `table-editable`
 * and `table-async`; the difference is entirely in which props you hand it, so each demo below
 * turns on a different set and nothing else:
 *
 * - `table`          — read-only rows, selection, resize, sort. The base configuration.
 * - `table-editable` — `editable` cells + the row/column menus + header renaming: state the user writes.
 * - `table-async`    — `loading` + `onEndReached`: pages that arrive late, skeleton rows, empty state.
 *
 * `data` and `columns` are arrays (never JSX children), so every row type below is a plain object
 * and `columns` reads its properties by `key`. English and hard-coded on purpose — the debug page
 * is exempt from the i18n rules and gets deleted before release.
 */

type Invoice = {
  id: string
  customer: string
  plan: string
  amount: number
  status: string
}

const INVOICES: Invoice[] = [
  { id: 'inv-0001', customer: 'Nakamura Studio', plan: 'Scale', amount: 1480, status: 'Paid' },
  { id: 'inv-0002', customer: 'Bridgewater Labs', plan: 'Team', amount: 320, status: 'Paid' },
  { id: 'inv-0003', customer: 'Kestrel Freight', plan: 'Team', amount: 320, status: 'Overdue' },
  { id: 'inv-0004', customer: 'Hollow Oak Coffee', plan: 'Starter', amount: 48, status: 'Paid' },
  { id: 'inv-0005', customer: 'Meridian Health', plan: 'Scale', amount: 1480, status: 'Open' },
  { id: 'inv-0006', customer: 'Atlas Foundry', plan: 'Starter', amount: 48, status: 'Paid' },
  { id: 'inv-0007', customer: 'Sable & Vance', plan: 'Team', amount: 320, status: 'Open' },
  { id: 'inv-0008', customer: 'Pinewood Analytics', plan: 'Scale', amount: 1480, status: 'Overdue' },
  { id: 'inv-0009', customer: 'Cobalt Interiors', plan: 'Starter', amount: 48, status: 'Paid' },
  { id: 'inv-0010', customer: 'Riverbend Media', plan: 'Team', amount: 320, status: 'Paid' },
  { id: 'inv-0011', customer: 'Tessellate Robotics', plan: 'Scale', amount: 1480, status: 'Open' },
  { id: 'inv-0012', customer: 'Quarry Lane Books', plan: 'Starter', amount: 48, status: 'Paid' },
]

const INVOICE_COLUMNS: TableColumn<Invoice>[] = [
  { key: 'customer', header: 'Customer', width: '30%' },
  { key: 'plan', header: 'Plan', sortable: true, width: '140px' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    sortable: true,
    width: '130px',
    sortValue: (row) => row.amount,
    cell: (row) => `$${row.amount.toLocaleString()}`,
  },
  { key: 'status', header: 'Status', width: '120px' },
]

type Task = {
  id: string
  title: string
  owner: string
  estimate: string
}

const INITIAL_TASKS: Task[] = [
  { id: 'task-1', title: 'Draft the pricing page', owner: 'Mina', estimate: '3d' },
  { id: 'task-2', title: 'Migrate the invoice webhooks', owner: 'Ravi', estimate: '1w' },
  { id: 'task-3', title: 'Audit empty states', owner: 'Jules', estimate: '2d' },
  { id: 'task-4', title: 'Load-test the export job', owner: 'Mina', estimate: '4d' },
]

/** Every value is a string, which is what `EditableCell` writes back. */
const TASK_COLUMNS: TableColumn<Task>[] = [
  { key: 'title', header: 'Task', width: '40%', editable: true },
  { key: 'owner', header: 'Owner', width: '20%', editable: true },
  { key: 'estimate', header: 'Estimate', width: '20%', editable: true },
]

type LogRow = {
  id: string
  time: string
  service: string
  level: string
  message: string
  ms: number
}

const LOG_SERVICES = ['api', 'worker', 'scheduler', 'gateway']
const LOG_LEVELS = ['info', 'info', 'debug', 'warn', 'info', 'error']

const LOG_COLUMNS: TableColumn<LogRow>[] = [
  { key: 'time', header: 'Time', width: '120px' },
  { key: 'service', header: 'Service', width: '130px' },
  {
    key: 'level',
    header: 'Level',
    width: '100px',
    cell: (row) => (
      <span
        className={
          row.level === 'error'
            ? 'text-destructive'
            : row.level === 'warn'
              ? 'text-foreground'
              : 'text-muted-foreground'
        }
      >
        {row.level}
      </span>
    ),
  },
  { key: 'message', header: 'Message' },
  {
    key: 'ms',
    header: 'ms',
    align: 'right',
    sortable: true,
    width: '90px',
    sortValue: (row) => row.ms,
  },
]

const PAGE_SIZE = 25
const MAX_ROWS = 200
/** Stand-in for a network round trip — long enough to see the skeleton rows. */
const FETCH_MS = 850

function makeLogPage(start: number, count: number): LogRow[] {
  return Array.from({ length: count }, (_, index) => {
    const sequence = start + index
    return {
      id: `log-${sequence}`,
      time: new Date(Date.now() - sequence * 1500).toLocaleTimeString(),
      service: LOG_SERVICES[sequence % LOG_SERVICES.length],
      level: LOG_LEVELS[sequence % LOG_LEVELS.length],
      message: `GET /api/v1/orders/${1000 + sequence} handled`,
      ms: 12 + ((sequence * 37) % 480),
    }
  })
}

export function DataSection() {
  // table — selection is the only state; sort and resize are uncontrolled.
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(['inv-0007'])

  // table-editable — rows and columns are both editable, so both live in state.
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [taskColumns, setTaskColumns] = useState<TableColumn<Task>[]>(TASK_COLUMNS)
  const nextTaskId = useRef(INITIAL_TASKS.length + 1)
  const nextColumnId = useRef(1)

  // table-async — pages arrive from a timer, not a server.
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    if (!loadingLogs) return
    const timer = setTimeout(() => {
      setLogs((prev) => [...prev, ...makeLogPage(prev.length, PAGE_SIZE)].slice(0, MAX_ROWS))
      setLoadingLogs(false)
    }, FETCH_MS)
    return () => clearTimeout(timer)
  }, [loadingLogs])

  const editCell = (rowId: string, columnKey: string, value: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== rowId) return task
        if (columnKey === 'title') return { ...task, title: value }
        if (columnKey === 'owner') return { ...task, owner: value }
        if (columnKey === 'estimate') return { ...task, estimate: value }
        return task
      }),
    )
  }

  const renameColumn = (columnKey: string, value: string) => {
    setTaskColumns((prev) =>
      prev.map((column) => (column.key === columnKey ? { ...column, header: value } : column)),
    )
  }

  const insertTask = (index: number, position: 'before' | 'after') => {
    const at = position === 'before' ? index : index + 1
    const task: Task = {
      id: `task-${nextTaskId.current}`,
      title: '',
      owner: '',
      estimate: '',
    }
    nextTaskId.current += 1
    setTasks((prev) => [...prev.slice(0, at), task, ...prev.slice(at)])
  }

  const insertColumn = (index: number, position: 'before' | 'after') => {
    const at = position === 'before' ? index : index + 1
    const column: TableColumn<Task> = {
      key: `column-${nextColumnId.current}`,
      header: 'New column',
      width: '20%',
      // No `cell` renderer: an editable column falls back to the row property, which a fresh
      // column does not have — the cells start empty and are typed into.
      editable: true,
    }
    nextColumnId.current += 1
    setTaskColumns((prev) => [...prev.slice(0, at), column, ...prev.slice(at)])
  }

  const reachedEnd = logs.length >= MAX_ROWS
  const loadMore = useCallback(() => setLoadingLogs(true), [])

  return (
    <Section
      title="Data & tables"
      description="One Table component, three registry entries. Same data/columns API each time — what changes is which props are switched on: selection and resize, in-place editing, or a late-arriving page."
    >
      <Demo label="table" height={460}>
        <div className="flex h-full w-full flex-col gap-3 p-3">
          <Table
            data={INVOICES}
            columns={INVOICE_COLUMNS}
            getRowId={(row) => row.id}
            height={300}
            defaultSort={{ key: 'amount', direction: 'desc' }}
            selectable
            selectedRowIds={selectedInvoiceIds}
            onSelectionChange={setSelectedInvoiceIds}
            resizable
          />
          <p className="text-xs text-muted-foreground">
            {selectedInvoiceIds.length} of {INVOICES.length} selected · click a header to sort, drag
            its right edge to resize a column. Rows are virtualized, which is why `rowHeight` is a
            fixed number.
          </p>
        </div>
      </Demo>

      <Demo label="table-editable" height={460}>
        <div className="flex h-full w-full flex-col gap-3 p-3">
          <Table
            data={tasks}
            columns={taskColumns}
            getRowId={(row) => row.id}
            height={300}
            rowHeight={56}
            onCellEdit={editCell}
            onColumnRename={renameColumn}
            resizable
            reorderable
            onInsertRow={insertTask}
            onDeleteRow={(rowId) => setTasks((prev) => prev.filter((task) => task.id !== rowId))}
            onInsertColumn={insertColumn}
            onDeleteColumn={(columnKey) =>
              setTaskColumns((prev) => prev.filter((column) => column.key !== columnKey))
            }
          />
          <p className="text-xs text-muted-foreground">
            {tasks.length} tasks · type straight into a cell, or into a header (a non-sortable header
            becomes an input once `onColumnRename` is set). Hover a row for the row menu, a header
            for the column menu; drag the grip to reorder.
          </p>
        </div>
      </Demo>

      <Demo label="table-async" height={460}>
        <div className="flex h-full w-full flex-col gap-3 p-3">
          <Table
            data={logs}
            columns={LOG_COLUMNS}
            getRowId={(row) => row.id}
            height={300}
            loading={loadingLogs}
            skeletonRows={4}
            emptyState="No log lines loaded"
            onEndReached={reachedEnd ? undefined : loadMore}
            defaultSort={{ key: 'ms', direction: 'desc' }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={loadMore} disabled={loadingLogs}>
              Reload first page
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLogs([])
                setLoadingLogs(false)
              }}
            >
              Clear (show the empty state)
            </Button>
            <span className="text-xs text-muted-foreground">
              {logs.length} of {MAX_ROWS} rows {reachedEnd ? '· all loaded' : '· scroll for more'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            `loading` with an empty list paints skeleton rows across the viewport; with rows
            already on screen it paints `skeletonRows` of them under the last row. `onEndReached`
            fires once per dwell near the bottom and is paused while loading. Sorting is on (by
            `ms`), so a fresh page lands in the order of the column, not the order it arrived —
            click the header to drop the sort and watch pages append instead.
          </p>
        </div>
      </Demo>

      <p className="max-w-3xl text-xs text-muted-foreground">
        These are the same component with different props — if you only need one of them, install
        `table` and pass the props you want; the other two registry entries exist to show the
        combinations. Every table here keeps its own `height` inside the fixed-height demo box, so
        the page itself never grows.
      </p>
    </Section>
  )
}
