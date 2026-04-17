import { notFound } from "next/navigation"
import { EntryForm } from "@/components/log/entry-form"
import { createClient } from "@/utils/supabase/server"

export default async function EditLogEntryPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [{ data: entry }, { data: payees }, { data: periods }, { data: attachments }, { data: aggregates }] = await Promise.all([
    supabase
      .from("log_entries")
      .select("id,period_id,payee_id,title,category,entry_date,description,notes,quantity,unit_cost,status")
      .eq("id", params.id)
      .maybeSingle(),
    supabase.from("payees").select("id,name").eq("is_active", true).order("name"),
    supabase.from("budget_periods").select("id,name,budget_amount").order("start_date", { ascending: false }),
    supabase
      .from("attachments")
      .select("id,file_name,storage_path,storage_bucket")
      .eq("log_entry_id", params.id)
      .order("created_at", { ascending: false }),
    supabase.from("log_entries").select("payee_id,period_id,status,line_total").in("status", ["ready", "invoiced"]),
  ])

  if (!entry) notFound()

  const payeeTotalsByKey: Record<string, { invoiced: number; ready: number }> = {}
  const periodSpend: Record<string, number> = {}
  const periodBudgets: Record<string, number> = Object.fromEntries(
    (periods ?? []).map((period) => [period.id, Number(period.budget_amount ?? 0)]),
  )
  for (const row of aggregates ?? []) {
    const key = `${row.payee_id}|${row.period_id}`
    if (!payeeTotalsByKey[key]) payeeTotalsByKey[key] = { invoiced: 0, ready: 0 }
    if (row.status === "invoiced") payeeTotalsByKey[key].invoiced += Number(row.line_total)
    if (row.status === "ready") payeeTotalsByKey[key].ready += Number(row.line_total)
    periodSpend[row.period_id] = (periodSpend[row.period_id] ?? 0) + Number(row.line_total)
  }

  return (
    <EntryForm
      mode="edit"
      entryId={entry.id}
      readOnly={entry.status === "invoiced"}
      payees={payees ?? []}
      periods={periods ?? []}
      attachments={attachments ?? []}
      defaults={{
        period_id: entry.period_id,
        payee_id: entry.payee_id,
        title: entry.title,
        category: entry.category,
        entry_date: entry.entry_date,
        description: entry.description ?? "",
        notes: entry.notes ?? "",
        quantity: Number(entry.quantity),
        unit_cost: Number(entry.unit_cost),
        status: entry.status === "invoiced" ? "ready" : entry.status,
      }}
      insightData={{
        payeeTotalsByKey,
        periodBudgets,
        periodSpend,
      }}
    />
  )
}
