import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { formatCurrency, formatDate } from "@/lib/format"

type PageProps = { searchParams: { tab?: string; status?: string; period?: string; payee?: string } }

export default async function InvoicesPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const tab = searchParams.tab === "summaries" ? "summaries" : "payee"

  const payeeQuery = supabase
    .from("payee_invoices")
    .select("id,invoice_number,issued_date,total_amount,status,period:budget_periods(name),payee:payees(name)")
    .order("created_at", { ascending: false })
  if (searchParams.status) payeeQuery.eq("status", searchParams.status)
  if (searchParams.period) payeeQuery.eq("period_id", searchParams.period)
  if (searchParams.payee) payeeQuery.eq("payee_id", searchParams.payee)

  const summaryQuery = supabase
    .from("internal_summaries")
    .select("id,summary_number,total_spend,budget_amount,variance_amount,percent_of_budget,status,period:budget_periods(name)")
    .order("created_at", { ascending: false })
  if (searchParams.status) summaryQuery.eq("status", searchParams.status)
  if (searchParams.period) summaryQuery.eq("period_id", searchParams.period)

  const [{ data: payeeInvoices }, { data: summaries }, { data: payees }, { data: periods }] = await Promise.all([
    payeeQuery,
    summaryQuery,
    supabase.from("payees").select("id,name").order("name"),
    supabase.from("budget_periods").select("id,name").order("start_date", { ascending: false }),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Invoices</h2>
        <Link href="/invoices/new" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
          Build Invoices
        </Link>
      </div>
      <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input type="hidden" name="tab" value={tab} />
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="finalised">Finalised</option>
        </select>
        <select name="period" defaultValue={searchParams.period ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All periods</option>
          {(periods ?? []).map((period) => (
            <option key={period.id} value={period.id}>
              {period.name}
            </option>
          ))}
        </select>
        <select name="payee" defaultValue={searchParams.payee ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All payees</option>
          {(payees ?? []).map((payee) => (
            <option key={payee.id} value={payee.id}>
              {payee.name}
            </option>
          ))}
        </select>
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm">Apply</button>
      </form>

      <div className="flex gap-2">
        <Link href="/invoices?tab=payee" className={`rounded-md px-3 py-2 text-sm ${tab === "payee" ? "bg-slate-900 text-white" : "border border-slate-300"}`}>
          Payee Invoices
        </Link>
        <Link
          href="/invoices?tab=summaries"
          className={`rounded-md px-3 py-2 text-sm ${tab === "summaries" ? "bg-slate-900 text-white" : "border border-slate-300"}`}
        >
          Internal Summaries
        </Link>
      </div>

      {tab === "payee" ? (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Invoice #</th>
                <th className="px-3 py-2">Payee</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Issued</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">PDF</th>
              </tr>
            </thead>
            <tbody>
              {(payeeInvoices ?? []).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <Link className="underline" href={`/invoices/payee/${row.id}`}>
                      {row.invoice_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {((row.payee as any)?.name as string | undefined) ??
                      (Array.isArray(row.payee) ? ((row.payee as any[])[0]?.name as string | undefined) : undefined) ??
                      "-"}
                  </td>
                  <td className="px-3 py-2">
                    {((row.period as any)?.name as string | undefined) ??
                      (Array.isArray(row.period) ? ((row.period as any[])[0]?.name as string | undefined) : undefined) ??
                      "-"}
                  </td>
                  <td className="px-3 py-2">{formatDate(row.issued_date)}</td>
                  <td className="px-3 py-2">{formatCurrency(Number(row.total_amount))}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2">
                    <a className="underline" href={`/api/invoices/payee/${row.id}/pdf`}>
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Summary #</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Total spend</th>
                <th className="px-3 py-2">Budget</th>
                <th className="px-3 py-2">Variance</th>
                <th className="px-3 py-2">% Budget</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(summaries ?? []).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <Link className="underline" href={`/invoices/summary/${row.id}`}>
                      {row.summary_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {((row.period as any)?.name as string | undefined) ??
                      (Array.isArray(row.period) ? ((row.period as any[])[0]?.name as string | undefined) : undefined) ??
                      "-"}
                  </td>
                  <td className="px-3 py-2">{formatCurrency(Number(row.total_spend))}</td>
                  <td className="px-3 py-2">{formatCurrency(Number(row.budget_amount))}</td>
                  <td className="px-3 py-2">{formatCurrency(Number(row.variance_amount))}</td>
                  <td className="px-3 py-2">{(Number(row.percent_of_budget) * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
