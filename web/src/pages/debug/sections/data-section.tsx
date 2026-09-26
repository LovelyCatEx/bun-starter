import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Demo, Section } from '@/pages/debug/sections/section'

const chartData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 173, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 264, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-3)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const invoices = [
  { id: 'INV-001', status: 'Paid', method: 'Credit card', amount: '$250.00' },
  { id: 'INV-002', status: 'Pending', method: 'PayPal', amount: '$150.00' },
  { id: 'INV-003', status: 'Unpaid', method: 'Bank transfer', amount: '$350.00' },
] as const

function ChartDemo() {
  return (
    <Demo label="Chart" className="items-stretch">
      <ChartContainer config={chartConfig} className="h-64 w-full max-w-2xl">
        <BarChart data={chartData} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
      <p className="text-xs text-muted-foreground">
        ChartContainer injects --color-* variables per theme through ChartStyle, so
        the bars recolor when you flip the theme.
      </p>
    </Demo>
  )
}

function AvatarDemo() {
  return (
    <Demo label="Avatar">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar size="sm">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>LG</AvatarFallback>
        <AvatarBadge />
      </Avatar>
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>MS</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+4</AvatarGroupCount>
      </AvatarGroup>
    </Demo>
  )
}

function TableDemo() {
  const [selected, setSelected] = useState('INV-002')

  return (
    <Demo label="Table" className="items-stretch">
      <div className="w-full max-w-2xl rounded-xl border">
        <Table>
          <TableCaption>Click a row to select it.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                data-state={invoice.id === selected ? 'selected' : undefined}
                onClick={() => setSelected(invoice.id)}
              >
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      invoice.status === 'Paid'
                        ? 'secondary'
                        : invoice.status === 'Pending'
                          ? 'outline'
                          : 'destructive'
                    }
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.method}
                </TableCell>
                <TableCell className="text-right">{invoice.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">$750.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Demo>
  )
}

export function DataSection() {
  return (
    <Section
      title="Data"
      description="Table, Avatar and Chart (recharts)."
    >
      <ChartDemo />
      <AvatarDemo />
      <TableDemo />
    </Section>
  )
}
