import { cn } from 'cn'
import type { ReactNode } from 'react'

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border p-6 text-card-foreground">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </section>
  )
}

export function Demo({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className={cn('flex flex-wrap items-center gap-3', className)}>
        {children}
      </div>
    </div>
  )
}
