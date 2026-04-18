"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { formatCurrency, formatDate } from "@/lib/format"
import { useToast } from "@/components/ui/toast"

export type BuilderEntry = {
  id: string
  title: string
  entry_date: string
  quantity: number
  unit_cost: number
  line_total: number
  payee_id: string
  payee_name: string
}

export function InvoiceBuilder({ periodId, entries, budgetAmount }: { periodId: string; entries: BuilderEntry[]; budgetAmount: number }) {
  const { pushToast } = useToast()
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(entries.map((entry) => [entry.id, true])),
  )
  const [loading, setLoading] = useState(false)
  const grouped = useMemo(() => {
    const map = new Map<string, BuilderEntry[]>()
    for (const entry of entries) {
      if (!map.has(entry.payee_id)) map.set(entry.payee_id, [])
      map.get(entry.payee_id)!.push(entry)
    }
    return map
  }, [entries])

  const totalsByPayee = useMemo(() => {
    const out = new Map<string, number>()
    for (const [payeeId, rows] of Array.from(grouped.entries())) {
      out.set(
        payeeId,
        rows.reduce((sum: number, row) => (selected[row.id] ? sum + Number(row.line_total) : sum), 0),
      )
    }
    return out
  }, [grouped, selected])

  const runTotal = Array.from(totalsByPayee.values()).reduce((sum, value) => sum + value, 0)
  const pct = budgetAmount ? (runTotal / budgetAmount) * 100 : 0
  const alertClass = pct >= 100 ? "bg-red-100 text-red-700" : pct >= 80 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"

  const generate = async () => {
    setLoading(true)
    const entryIds = Object.entries(selected)
      .filter(([, checked]) => checked)
      .map(([id]) => id)
    const response = await fetch("/api/invoices/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodId, entryIds }),
    })
    setLoading(false)
    if (response.ok) {
      pushToast("Invoices generated successfully.", "success")
      window.location.href = "/invoices"
      return
    }
    const payload = await response.json().catch(() => ({}))
    pushToast(payload.error ?? "Invoice generation failed.", "error")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([payeeId, rows]) => (
          <details key={payeeId} open className="rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold">{rows[0]?.payee_name ?? "Payee"}</summary>
            <div className="mt-3 space-y-2">
              {rows.map((row) => (
                <label
                  key={row.id}
                  className="flex flex-col gap-3 rounded-md border border-slate-100 px-3 py-3 text-sm sm:flex-row sm:items-start sm:justify-between"
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 shrink-0"
                      checked={Boolean(selected[row.id])}
                      onChange={(event) =>
                        setSelected((prev) => ({
                          ...prev,
                          [row.id]: event.target.checked,
                        }))
                      }
                    />
                    <span className="min-w-0 flex flex-col">
                      <span className="font-medium text-slate-900">
                        {row.title} · {formatDate(row.entry_date)}
                      </span>
                      <Link href={`/log/${row.id}`} className="text-xs text-slate-500 underline">
                        Source entry: {row.id.slice(0, 8)}
                      </Link>
                    </span>
                  </span>
                  <span className="shrink-0 pl-8 text-slate-700 sm:pl-0 sm:text-right">
                    {Number(row.quantity)} × {formatCurrency(Number(row.unit_cost))} = {formatCurrency(Number(row.line_total))}
                  </span>
                </label>
              ))}
            </div>
          </details>
        ))}
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className={`rounded-md px-3 py-2 text-sm ${alertClass}`}>
          Budget usage: {pct.toFixed(1)}% ({formatCurrency(runTotal)} / {formatCurrency(budgetAmount)})
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h3 className="font-semibold">Summary</h3>
          <ul className="mt-2 space-y-1">
            {Array.from(grouped.entries()).map(([payeeId, rows]) => (
              <li key={payeeId} className="flex justify-between">
                <span>{rows[0]?.payee_name}</span>
                <span>{formatCurrency(totalsByPayee.get(payeeId) ?? 0)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-slate-100 pt-2 font-semibold">Run total: {formatCurrency(runTotal)}</div>
          <button
            disabled={loading}
            onClick={generate}
            className="mt-3 w-full rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Invoices"}
          </button>
        </div>
      </aside>
    </div>
  )
}
