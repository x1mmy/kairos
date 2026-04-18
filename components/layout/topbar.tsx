import { ReactNode } from "react"

type TopbarProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  onMenuClick?: () => void
}

export function Topbar({ title, subtitle, actions, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:py-4 md:px-6 lg:px-8">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Open sidebar"
          >
            ☰
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 sm:mt-1 sm:text-sm">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
