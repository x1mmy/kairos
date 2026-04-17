import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { formatCurrency, formatDate } from "@/lib/format"

type BudgetPeriod = {
  id: string
  name: string
  budget_amount: number
}

type LogEntry = {
  id: string
  title: string
  status: "draft" | "ready" | "invoiced"
  line_total: number
  entry_date: string
  payee: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: currentPeriod } = await supabase
    .from("budget_periods")
    .select("id,name,budget_amount")
    .eq("is_current", true)
    .maybeSingle<BudgetPeriod>()

  if (!currentPeriod) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
        No current budget period found. Create a period in Settings to start tracking.
      </div>
    )
  }

  const { data: periodEntries } = await supabase
    .from("log_entries")
    .select("id,title,status,line_total,entry_date,payee:payees(name)")
    .eq("period_id", currentPeriod.id)
    .order("entry_date", { ascending: false })
    .returns<LogEntry[]>()

  const invoiced = (periodEntries ?? [])
    .filter((entry) => entry.status === "invoiced")
    .reduce((sum, entry) => sum + Number(entry.line_total), 0)
  const ready = (periodEntries ?? [])
    .filter((entry) => entry.status === "ready")
    .reduce((sum, entry) => sum + Number(entry.line_total), 0)
  const combined = invoiced + ready
  const remaining = Number(currentPeriod.budget_amount) - combined
  const percentage = Number(currentPeriod.budget_amount)
    ? Math.min((combined / Number(currentPeriod.budget_amount)) * 100, 100)
    : 0
  const progressColor =
    percentage >= 100 ? "bg-red-500" : percentage >= 80 ? "bg-amber-500" : "bg-emerald-500"

  const payeeMap = new Map<string, { invoiced: number; ready: number; name: string }>()
  for (const entry of periodEntries ?? []) {
    const payeeName = entry.payee?.name ?? "Unknown"
    const key = payeeName
    if (!payeeMap.has(key)) payeeMap.set(key, { invoiced: 0, ready: 0, name: payeeName })
    const row = payeeMap.get(key)!
    if (entry.status === "invoiced") row.invoiced += Number(entry.line_total)
    if (entry.status === "ready") row.ready += Number(entry.line_total)
  }

  const payeeBreakdown = Array.from(payeeMap.values())

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">{currentPeriod.name} Budget Summary</h2>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
          <Metric label="Invoiced" value={formatCurrency(invoiced)} />
          <Metric label="Ready" value={formatCurrency(ready)} />
          <Metric label="Combined" value={formatCurrency(combined)} />
          <Metric label="Remaining" value={formatCurrency(remaining)} />
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-100">
          <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${percentage}%` }} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">Payee Breakdown</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Payee</th>
                <th>Invoiced</th>
                <th>Ready</th>
                <th>Combined</th>
                <th>% Budget</th>
              </tr>
            </thead>
            <tbody>
              {payeeBreakdown.map((row) => {
                const total = row.invoiced + row.ready
                const pct = Number(currentPeriod.budget_amount)
                  ? (total / Number(currentPeriod.budget_amount)) * 100
                  : 0
                return (
                  <tr key={row.name} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-800">{row.name}</td>
                    <td>{formatCurrency(row.invoiced)}</td>
                    <td>{formatCurrency(row.ready)}</td>
                    <td>{formatCurrency(total)}</td>
                    <td className="min-w-36">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-slate-700" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Recent Entries</h3>
          <Link className="text-sm text-slate-700 underline" href="/log">
            View all
          </Link>
        </div>
        <ul className="space-y-2">
          {(periodEntries ?? []).slice(0, 5).map((entry) => (
            <li key={entry.id} className="rounded-md border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800">{entry.title}</p>
                  <p className="text-xs text-slate-500">
                    {entry.payee?.name ?? "Unknown"} · {formatDate(entry.entry_date)}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatCurrency(Number(entry.line_total))}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  )
}
