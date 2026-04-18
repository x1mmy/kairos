import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { formatCurrency, formatDate } from "@/lib/format"

type PageProps = { searchParams: { status?: string; period?: string; payee?: string } }

export default async function InvoicesPage({ searchParams }: PageProps) {
  noStore()
  const supabase = createClient()

  let payeeQuery = supabase
    .from("payee_invoices")
    .select("id,invoice_number,issued_date,total_amount,status,period:budget_periods(name),payee:payees(name)")
  if (searchParams.status) payeeQuery = payeeQuery.eq("status", searchParams.status)
  if (searchParams.period) payeeQuery = payeeQuery.eq("period_id", searchParams.period)
  if (searchParams.payee) payeeQuery = payeeQuery.eq("payee_id", searchParams.payee)
  payeeQuery = payeeQuery.order("created_at", { ascending: false })

  const [{ data: payeeInvoices }, { data: payees }, { data: periods }] = await Promise.all([
    payeeQuery,
    supabase.from("payees").select("id,name").order("name"),
    supabase.from("budget_periods").select("id,name").order("start_date", { ascending: false }),
  ])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Invoices</h2>
        <Link
          href="/invoices/new"
          prefetch={false}
          className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white sm:shrink-0"
        >
          Build Invoices
        </Link>
      </div>
      <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2 lg:col-span-1"
        >
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
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
            {(payeeInvoices ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  No payee invoices match these filters.
                </td>
              </tr>
            ) : null}
            {(payeeInvoices ?? []).map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <Link prefetch={false} className="underline" href={`/invoices/payee/${row.id}`}>
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
    </div>
  )
}
