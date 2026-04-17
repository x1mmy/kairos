import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { formatCurrency } from "@/lib/format"
import { SummaryStatusActions } from "@/components/invoices/status-actions"

export default async function SummaryViewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: summary } = await supabase
    .from("internal_summaries")
    .select("id,summary_number,total_spend,budget_amount,variance_amount,status,period:budget_periods(id,name)")
    .eq("id", params.id)
    .maybeSingle()
  if (!summary) notFound()
  const period = Array.isArray(summary.period) ? summary.period[0] : summary.period

  const { data: invoices } = await supabase
    .from("payee_invoices")
    .select("id,invoice_number,total_amount,payee:payees(name)")
    .eq("period_id", period?.id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{summary.summary_number}</h2>
          <p className="text-sm text-slate-500">{period?.name}</p>
        </div>
        <SummaryStatusActions id={summary.id} status={summary.status} />
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Payee</th>
              <th>Invoice #</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((invoice) => (
              <tr key={invoice.id} className="border-t border-slate-100">
                <td className="py-2">
                  {((invoice.payee as any)?.name as string | undefined) ??
                    (Array.isArray(invoice.payee) ? ((invoice.payee as any[])[0]?.name as string | undefined) : undefined) ??
                    "-"}
                </td>
                <td>{invoice.invoice_number}</td>
                <td>{formatCurrency(Number(invoice.total_amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-y-1 text-sm">
          <p>Total spend: {formatCurrency(Number(summary.total_spend))}</p>
          <p>Budget target: {formatCurrency(Number(summary.budget_amount))}</p>
          <p>Variance: {formatCurrency(Number(summary.variance_amount))}</p>
        </div>
        <a href={`/api/invoices/summary/${summary.id}/pdf`} className="mt-4 inline-block rounded-md border px-3 py-2 text-sm">
          Download PDF
        </a>
      </section>
    </div>
  )
}
