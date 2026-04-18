"use client"

import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/format"

export type LogRow = {
  id: string
  title: string
  category: string
  entry_date: string
  quantity: number
  unit_cost: number
  line_total: number
  status: "draft" | "ready" | "invoiced"
  payee: { name: string } | null
  period?: { name: string } | null
}

export function LogTable({ rows }: { rows: LogRow[] }) {
  return (
    <div className="space-y-3">
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <Link className="font-medium text-slate-900 underline" href={`/log/${row.id}`}>
                {row.title}
              </Link>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-700">
                {row.status}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
              <div>
                <dt className="text-slate-400">Payee</dt>
                <dd className="font-medium text-slate-800">{row.payee?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Period</dt>
                <dd className="font-medium text-slate-800">{row.period?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Category</dt>
                <dd>{row.category}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Date</dt>
                <dd>{formatDate(row.entry_date)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Qty</dt>
                <dd>{Number(row.quantity)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Unit</dt>
                <dd>{formatCurrency(Number(row.unit_cost))}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400">Total</dt>
                <dd className="text-base font-semibold text-slate-900">{formatCurrency(Number(row.line_total))}</dd>
              </div>
            </dl>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No entries found for these filters.
          </li>
        ) : null}
      </ul>

      <div className="hidden overflow-x-auto rounded-md border border-slate-200 md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Payee</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Unit Cost</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">
                  <Link className="underline" href={`/log/${row.id}`}>
                    {row.title}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.payee?.name ?? "-"}</td>
                <td className="px-3 py-2">{row.category}</td>
                <td className="px-3 py-2">{row.period?.name ?? "-"}</td>
                <td className="px-3 py-2">{formatDate(row.entry_date)}</td>
                <td className="px-3 py-2">{Number(row.quantity)}</td>
                <td className="px-3 py-2">{formatCurrency(Number(row.unit_cost))}</td>
                <td className="px-3 py-2">{formatCurrency(Number(row.line_total))}</td>
                <td className="px-3 py-2 capitalize">{row.status}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  No entries found for these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
