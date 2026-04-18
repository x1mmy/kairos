import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { LogTable, type LogRow } from "@/components/log/log-table"

type PageProps = {
  searchParams: {
    q?: string
    payee?: string
    status?: string
    period?: string
    page?: string
  }
}

const PAGE_SIZE = 20

export default async function LogPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const page = Number(searchParams.page ?? 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from("log_entries")
    .select("id,title,category,entry_date,quantity,unit_cost,line_total,status,payee:payees(name),period:budget_periods(name)", {
      count: "exact",
    })
    .order("entry_date", { ascending: false })
    .range(from, to)

  if (searchParams.q) query = query.ilike("title", `%${searchParams.q}%`)
  if (searchParams.payee) query = query.eq("payee_id", searchParams.payee)
  if (searchParams.status) query = query.eq("status", searchParams.status)
  if (searchParams.period) query = query.eq("period_id", searchParams.period)

  const [{ data: rows, count }, { data: payees }, { data: periods }] = await Promise.all([
    query.returns<LogRow[]>(),
    supabase.from("payees").select("id,name").eq("is_active", true).order("name"),
    supabase.from("budget_periods").select("id,name").order("start_date", { ascending: false }),
  ])

  const totalPages = Math.max(1, Math.ceil(Number(count ?? 0) / PAGE_SIZE))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Entry Log</h2>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white sm:shrink-0"
          href="/log/new"
        >
          New Entry
        </Link>
      </div>

      <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search title"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="payee" defaultValue={searchParams.payee ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">All payees</option>
          {(payees ?? []).map((payee) => (
            <option key={payee.id} value={payee.id}>
              {payee.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="invoiced">Invoiced</option>
        </select>
        <select name="period" defaultValue={searchParams.period ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">All periods</option>
          {(periods ?? []).map((period) => (
            <option key={period.id} value={period.id}>
              {period.name}
            </option>
          ))}
        </select>
        <div className="sm:col-span-2 lg:col-span-4">
          <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50" type="submit">
            Apply filters
          </button>
        </div>
      </form>

      <LogTable rows={rows ?? []} />

      <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/log?page=${Math.max(1, page - 1)}`}
            className={`rounded-md border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-50" : "border-slate-300"}`}
          >
            Previous
          </Link>
          <Link
            href={`/log?page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-md border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-50" : "border-slate-300"}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  )
}
