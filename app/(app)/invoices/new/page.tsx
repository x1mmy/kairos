import { InvoiceBuilder, type BuilderEntry } from "@/components/invoices/invoice-builder"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"

type PageProps = { searchParams: { period?: string } }

export default async function InvoiceBuilderPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const [{ data: periods }, { data: currentPeriod }, { data: readyRowsByPeriod }] = await Promise.all([
    supabase.from("budget_periods").select("id,name,budget_amount").order("start_date", { ascending: false }),
    supabase.from("budget_periods").select("id").eq("is_current", true).maybeSingle(),
    supabase.from("log_entries").select("period_id,created_at").eq("status", "ready").order("created_at", { ascending: false }),
  ])

  const explicitPeriodId = searchParams.period
  const currentPeriodId = currentPeriod?.id
  const periodWithReadyEntries = (readyRowsByPeriod ?? [])[0]?.period_id
  const periodId = explicitPeriodId ?? currentPeriodId ?? periodWithReadyEntries

  if (!periodId) {
    return <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm">No period selected.</div>
  }

  const [{ data: entries, error: entriesError }, { data: period }, { data: statusRows }, { data: payees }] = await Promise.all([
    supabase
      .from("log_entries")
      .select("id,title,entry_date,quantity,unit_cost,line_total,payee_id")
      .eq("period_id", periodId)
      .eq("status", "ready"),
    supabase.from("budget_periods").select("id,name,budget_amount").eq("id", periodId).maybeSingle(),
    supabase.from("log_entries").select("status").eq("period_id", periodId),
    supabase.from("payees").select("id,name"),
  ])
  const readyCount = (statusRows ?? []).filter((row) => row.status === "ready").length
  const draftCount = (statusRows ?? []).filter((row) => row.status === "draft").length
  const invoicedCount = (statusRows ?? []).filter((row) => row.status === "invoiced").length

  let readyRows: Array<{
    id: string
    title: string
    entry_date: string
    quantity: number
    unit_cost: number
    line_total?: number
    payee_id: string
  }> = (entries ?? []) as Array<{
    id: string
    title: string
    entry_date: string
    quantity: number
    unit_cost: number
    line_total?: number
    payee_id: string
  }>
  if (readyRows.length === 0 && readyCount > 0) {
    const { data: fallbackRows } = await supabase
      .from("log_entries")
      .select("id,title,entry_date,quantity,unit_cost,payee_id")
      .eq("period_id", periodId)
      .eq("status", "ready")
    readyRows = fallbackRows ?? []
  }

  const payeeNameById = new Map((payees ?? []).map((payee) => [payee.id, payee.name]))

  const mapped: BuilderEntry[] = readyRows.map((row) => ({
    id: row.id,
    title: row.title,
    entry_date: row.entry_date,
    quantity: Number(row.quantity),
    unit_cost: Number(row.unit_cost),
    line_total: Number(row.line_total ?? Number(row.quantity) * Number(row.unit_cost)),
    payee_id: row.payee_id,
    payee_name: payeeNameById.get(row.payee_id) ?? "Unknown",
  }))

  if (mapped.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <form className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Period</label>
          <select name="period" defaultValue={periodId} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {(periods ?? []).map((periodOption) => (
              <option key={periodOption.id} value={periodOption.id}>
                {periodOption.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-white">
            Switch period
          </button>
        </form>
        <h2 className="text-lg font-semibold">Nothing to invoice yet</h2>
        <p className="text-sm text-slate-600">
          Invoice Builder only includes entries with status <strong>Ready</strong>.
        </p>
        {entriesError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Could not load invoice rows: {entriesError.message}
          </p>
        ) : null}
        <ul className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <li>Ready: {readyCount}</li>
          <li>Draft: {draftCount}</li>
          <li>Already invoiced: {invoicedCount}</li>
        </ul>
        {periodWithReadyEntries && !explicitPeriodId && periodWithReadyEntries !== periodId ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Ready entries exist in another period. Use the period selector above.
          </p>
        ) : null}
        <div className="flex gap-2">
          <Link href="/log" className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            Go to Entry Log
          </Link>
          <Link href="/log/new" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
            Create New Entry
          </Link>
        </div>
        <p className="text-xs text-slate-500">Tip: open an entry and save it using the <em>Save Entry</em> button.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Period</label>
        <div className="flex items-center gap-2">
          <select name="period" defaultValue={periodId} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {(periods ?? []).map((periodOption) => (
              <option key={periodOption.id} value={periodOption.id}>
                {periodOption.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            Switch period
          </button>
          <span className="text-xs text-slate-500">Current: {period?.name ?? "Unknown period"}</span>
        </div>
      </form>
      <InvoiceBuilder periodId={periodId} entries={mapped} budgetAmount={Number(period?.budget_amount ?? 0)} />
    </div>
  )
}
