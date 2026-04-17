import { EntryForm } from "@/components/log/entry-form"
import { createClient } from "@/utils/supabase/server"

export default async function NewLogEntryPage() {
  const supabase = createClient()
  const [{ data: payees }, { data: periods }, { data: currentPeriod }, { data: aggregates }] = await Promise.all([
    supabase.from("payees").select("id,name").eq("is_active", true).order("name"),
    supabase.from("budget_periods").select("id,name,budget_amount").order("start_date", { ascending: false }),
    supabase.from("budget_periods").select("id,name,budget_amount").eq("is_current", true).maybeSingle(),
    supabase.from("log_entries").select("payee_id,period_id,status,line_total").in("status", ["ready", "invoiced"]),
  ])

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
      mode="create"
      payees={payees ?? []}
      periods={periods ?? []}
      attachments={[]}
      defaults={{
        period_id: currentPeriod?.id ?? periods?.[0]?.id ?? "",
        payee_id: payees?.[0]?.id ?? "",
        title: "",
        category: "",
        entry_date: new Date().toISOString().slice(0, 10),
        description: "",
        notes: "",
        quantity: 1,
        unit_cost: 0,
        status: "draft",
      }}
      insightData={{
        payeeTotalsByKey,
        periodBudgets,
        periodSpend,
      }}
      hasRequiredConfig={(payees?.length ?? 0) > 0 && (periods?.length ?? 0) > 0}
      requiredConfigMessage={
        (payees?.length ?? 0) === 0
          ? "No payees found. Create a payee first."
          : "No budget periods found. Save budget setup in Settings first."
      }
    />
  )
}
