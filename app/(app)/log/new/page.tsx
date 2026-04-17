import { EntryForm } from "@/components/log/entry-form"
import { createClient } from "@/utils/supabase/server"

export default async function NewLogEntryPage() {
  const supabase = createClient()
  const [{ data: payees }, { data: periods }, { data: currentPeriod }] = await Promise.all([
    supabase.from("payees").select("id,name").eq("is_active", true).order("name"),
    supabase.from("budget_periods").select("id,name").order("start_date", { ascending: false }),
    supabase.from("budget_periods").select("id,name,budget_amount").eq("is_current", true).maybeSingle(),
  ])

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
      insights={{
        payeeInvoiced: 0,
        payeeReady: 0,
        budgetRemaining: Number(currentPeriod?.budget_amount ?? 0),
      }}
    />
  )
}
