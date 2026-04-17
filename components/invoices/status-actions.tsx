"use client"

import { useState } from "react"

export function PayeeInvoiceStatusActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const update = async (next: "issued" | "paid") => {
    setLoading(true)
    await fetch(`/api/invoices/payee/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    setLoading(false)
    window.location.reload()
  }

  return (
    <div className="flex gap-2">
      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{status}</span>
      <button disabled={loading} onClick={() => update("issued")} className="rounded-md border px-3 py-1.5 text-sm">
        Mark as Issued
      </button>
      <button disabled={loading} onClick={() => update("paid")} className="rounded-md border px-3 py-1.5 text-sm">
        Mark as Paid
      </button>
    </div>
  )
}

export function SummaryStatusActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="flex gap-2">
      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{status}</span>
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          await fetch(`/api/invoices/summary/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "finalised" }),
          })
          window.location.reload()
        }}
        className="rounded-md border px-3 py-1.5 text-sm"
      >
        Mark as Finalised
      </button>
    </div>
  )
}
