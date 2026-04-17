import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { formatCurrency, formatDate } from "@/lib/format"

export default async function PayeesPage() {
  const supabase = createClient()
  const { data: payees } = await supabase
    .from("payees")
    .select("id,name,email,default_category,rate_type,default_rate,apply_gst")
    .eq("is_active", true)
    .order("name")

  const rows = await Promise.all(
    (payees ?? []).map(async (payee) => {
      const { data: totals } = await supabase
        .from("log_entries")
        .select("line_total,entry_date")
        .eq("payee_id", payee.id)
        .eq("status", "invoiced")
      const allTime = (totals ?? []).reduce((sum, entry) => sum + Number(entry.line_total), 0)
      const lastInvoiceDate = (totals ?? [])[0]?.entry_date ?? null
      return { ...payee, allTime, lastInvoiceDate }
    }),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Payees</h2>
        <Link href="/payees/new" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
          New Payee
        </Link>
      </div>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Rate</th>
              <th className="px-3 py-2">GST</th>
              <th className="px-3 py-2">All-time invoiced</th>
              <th className="px-3 py-2">Last invoice date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">
                  <Link className="underline" href={`/payees/${row.id}`}>
                    {row.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.email ?? "-"}</td>
                <td className="px-3 py-2">{row.default_category ?? "-"}</td>
                <td className="px-3 py-2">
                  {row.rate_type} · {formatCurrency(Number(row.default_rate))}
                </td>
                <td className="px-3 py-2">{row.apply_gst ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{formatCurrency(row.allTime)}</td>
                <td className="px-3 py-2">{formatDate(row.lastInvoiceDate)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  No active payees yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
