import { ReactNode } from "react"

type TopbarProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  onMenuClick?: () => void
}

export function Topbar({ title, subtitle, actions, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            ☰
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
