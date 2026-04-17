"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
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
}

export function LogTable({ rows }: { rows: LogRow[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, checked]) => checked).map(([id]) => id),
    [selected],
  )

  const setAll = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    for (const row of rows) {
      if (row.status !== "invoiced") next[row.id] = checked
    }
    setSelected(next)
  }

  const patchStatus = async () => {
    if (selectedIds.length === 0) return
    setLoading(true)
    const previous = { ...selected }
    setSelected({})
    const response = await fetch("/api/entries/bulk/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, status: "ready" }),
    })
    if (!response.ok) {
      setSelected(previous)
      setLoading(false)
      return
    }
    window.location.reload()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={rows.length > 0 && selectedIds.length === rows.filter((row) => row.status !== "invoiced").length}
            onChange={(event) => setAll(event.target.checked)}
          />
          Select all
        </label>
        <button
          type="button"
          disabled={loading || selectedIds.length === 0}
          onClick={patchStatus}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Updating..." : `Mark as Ready (${selectedIds.length})`}
        </button>
      </div>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2" />
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Payee</th>
              <th className="px-3 py-2">Category</th>
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
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    disabled={row.status === "invoiced"}
                    checked={Boolean(selected[row.id])}
                    onChange={(event) =>
                      setSelected((prev) => ({
                        ...prev,
                        [row.id]: event.target.checked,
                      }))
                    }
                  />
                </td>
                <td className="px-3 py-2 font-medium">
                  <Link className="underline" href={`/log/${row.id}`}>
                    {row.title}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.payee?.name ?? "-"}</td>
                <td className="px-3 py-2">{row.category}</td>
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
