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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Payees</h2>
        <Link
          href="/payees/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white sm:shrink-0"
        >
          New Payee
        </Link>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <Link className="font-medium text-slate-900 underline" href={`/payees/${row.id}`}>
                {row.name}
              </Link>
              <span className="shrink-0 text-xs text-slate-500">{row.apply_gst ? "GST" : "No GST"}</span>
            </div>
            <dl className="mt-3 space-y-2 text-xs text-slate-600">
              <div>
                <dt className="text-slate-400">Email</dt>
                <dd className="break-all text-slate-800">{row.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Category</dt>
                <dd>{row.default_category ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Rate</dt>
                <dd>
                  {row.rate_type} · {formatCurrency(Number(row.default_rate))}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">All-time invoiced</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(row.allTime)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Last invoice</dt>
                <dd>{formatDate(row.lastInvoiceDate)}</dd>
              </div>
            </dl>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No active payees yet.
          </li>
        ) : null}
      </ul>

      <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white md:block">
        <table className="w-full min-w-[880px] text-sm">
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

