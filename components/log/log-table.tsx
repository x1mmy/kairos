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
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[980px] text-sm">
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
