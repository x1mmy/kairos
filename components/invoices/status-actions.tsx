"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/toast"

export function PayeeInvoiceStatusActions({ id, status }: { id: string; status: string }) {
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(false)
  const update = async (next: "issued" | "paid") => {
    setLoading(true)
    const response = await fetch(`/api/invoices/payee/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    setLoading(false)
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      pushToast(payload.error ?? "Status update failed.", "error")
      return
    }
    pushToast(`Invoice marked as ${next}.`, "success")
    window.location.reload()
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{status}</span>
      <div className="flex flex-wrap gap-2">
        <button disabled={loading} onClick={() => update("issued")} className="rounded-md border px-3 py-2 text-sm sm:py-1.5">
          Mark as Issued
        </button>
        <button disabled={loading} onClick={() => update("paid")} className="rounded-md border px-3 py-2 text-sm sm:py-1.5">
          Mark as Paid
        </button>
      </div>
    </div>
  )
}
