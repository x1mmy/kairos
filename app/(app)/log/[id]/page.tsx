import { notFound } from "next/navigation"
import { EntryForm } from "@/components/log/entry-form"
import { createClient } from "@/utils/supabase/server"

export default async function EditLogEntryPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [{ data: entry }, { data: payees }, { data: periods }, { data: attachments }] = await Promise.all([
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
  ])

  if (!entry) notFound()

  const [payeeInvoiced, payeeReady, currentPeriod] = await Promise.all([
    sumByStatus(supabase, entry.payee_id, entry.period_id, "invoiced"),
    sumByStatus(supabase, entry.payee_id, entry.period_id, "ready"),
    supabase.from("budget_periods").select("budget_amount").eq("id", entry.period_id).maybeSingle(),
  ])

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
      insights={{
        payeeInvoiced,
        payeeReady,
        budgetRemaining: Number(currentPeriod.data?.budget_amount ?? 0) - (payeeInvoiced + payeeReady),
      }}
    />
  )
}

async function sumByStatus(
  supabase: ReturnType<typeof createClient>,
  payeeId: string,
  periodId: string,
  status: "ready" | "invoiced",
) {
  const { data } = await supabase
    .from("log_entries")
    .select("line_total")
    .eq("payee_id", payeeId)
    .eq("period_id", periodId)
    .eq("status", status)
  return (data ?? []).reduce((sum, row) => sum + Number(row.line_total), 0)
}
