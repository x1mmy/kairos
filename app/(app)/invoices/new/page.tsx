import { InvoiceBuilder, type BuilderEntry } from "@/components/invoices/invoice-builder"
import { createClient } from "@/utils/supabase/server"

type PageProps = { searchParams: { period?: string } }

export default async function InvoiceBuilderPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const periodId =
    searchParams.period ??
    (
      await supabase
        .from("budget_periods")
        .select("id")
        .eq("is_current", true)
        .maybeSingle()
    ).data?.id

  if (!periodId) {
    return <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm">No period selected.</div>
  }

  const [{ data: entries }, { data: period }] = await Promise.all([
    supabase
      .from("log_entries")
      .select("id,title,entry_date,quantity,unit_cost,line_total,payee_id,payee:payees(name)")
      .eq("period_id", periodId)
      .eq("status", "ready"),
    supabase.from("budget_periods").select("budget_amount").eq("id", periodId).maybeSingle(),
  ])

  const mapped: BuilderEntry[] = (entries ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    entry_date: row.entry_date,
    quantity: Number(row.quantity),
    unit_cost: Number(row.unit_cost),
    line_total: Number(row.line_total),
    payee_id: row.payee_id,
    payee_name:
      ((row.payee as any)?.name as string | undefined) ??
      (Array.isArray(row.payee) ? ((row.payee as any[])[0]?.name as string | undefined) : undefined) ??
      "Unknown",
  }))

  return <InvoiceBuilder periodId={periodId} entries={mapped} budgetAmount={Number(period?.budget_amount ?? 0)} />
}
