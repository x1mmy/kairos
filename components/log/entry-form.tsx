"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { formatCurrency } from "@/lib/format"

const schema = z.object({
  period_id: z.string().uuid(),
  payee_id: z.string().uuid(),
  title: z.string().min(1),
  category: z.string().min(1),
  entry_date: z.string().min(1),
  description: z.string().optional(),
  notes: z.string().optional(),
  quantity: z.coerce.number().min(0),
  unit_cost: z.coerce.number().min(0),
  status: z.enum(["draft", "ready"]),
})

type FormValues = z.infer<typeof schema>

type EntryFormProps = {
  mode: "create" | "edit"
  entryId?: string
  readOnly?: boolean
  defaults: FormValues
  payees: { id: string; name: string }[]
  periods: { id: string; name: string }[]
  attachments: { id: string; file_name: string; storage_path: string; storage_bucket: string }[]
  insights: {
    payeeInvoiced: number
    payeeReady: number
    budgetRemaining: number
  }
}

export function EntryForm({ mode, entryId, readOnly, defaults, payees, periods, attachments, insights }: EntryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [attachmentItems, setAttachmentItems] = useState(attachments)
  const form = useForm<FormValues>({
    defaultValues: defaults,
  })

  const quantity = form.watch("quantity")
  const unitCost = form.watch("unit_cost")
  const lineTotal = useMemo(() => Number(quantity || 0) * Number(unitCost || 0), [quantity, unitCost])

  const submit = form.handleSubmit(async (values) => {
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setSubmitError("Please check the form fields.")
      return
    }
    setSubmitError(null)
    const endpoint = mode === "create" ? "/api/log-entries" : `/api/log-entries/${entryId}`
    const method = mode === "create" ? "POST" : "PATCH"
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setSubmitError(payload.error ?? "Save failed")
      return
    }
    const id = mode === "create" ? payload.id : entryId
    window.location.href = id ? `/log/${id}` : "/log"
  })

  const onUpload = async (file?: File) => {
    if (!file || !entryId) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch(`/api/entries/${entryId}/attachments`, {
      method: "POST",
      body: formData,
    })
    setUploading(false)
    if (!response.ok) return
    window.location.reload()
  }

  const removeAttachment = async (item: { id: string; storage_path: string; storage_bucket: string }) => {
    if (!entryId) return
    const confirmed = window.confirm("Delete this attachment?")
    if (!confirmed) return
    await fetch(`/api/entries/${entryId}/attachments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachmentId: item.id,
        storagePath: item.storage_path,
        bucket: item.storage_bucket,
      }),
    })
    setAttachmentItems((prev) => prev.filter((row) => row.id !== item.id))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-5" onSubmit={submit}>
        <h2 className="text-lg font-semibold">{mode === "create" ? "New Entry" : "Edit Entry"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title">
            <input {...form.register("title")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Category">
            <input {...form.register("category")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Payee">
            <select {...form.register("payee_id")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm">
              {payees.map((payee) => (
                <option key={payee.id} value={payee.id}>
                  {payee.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Period">
            <select {...form.register("period_id")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm">
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" {...form.register("entry_date")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Status">
            <select {...form.register("status")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
            </select>
          </Field>
          <Field label="Quantity">
            <input type="number" step="0.01" {...form.register("quantity")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Unit cost">
            <input type="number" step="0.01" {...form.register("unit_cost")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
        </div>
        <Field label="Description">
          <textarea {...form.register("description")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm" rows={3} />
        </Field>
        <Field label="Notes">
          <textarea {...form.register("notes")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm" rows={3} />
        </Field>
        {!readOnly ? (
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
            Save Entry
          </button>
        ) : null}
        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      </form>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h3 className="font-semibold">Summary</h3>
          <p className="mt-2">Line total: {formatCurrency(lineTotal)}</p>
          <p>Payee invoiced: {formatCurrency(insights.payeeInvoiced)}</p>
          <p>Payee ready: {formatCurrency(insights.payeeReady)}</p>
          <p>Budget remaining: {formatCurrency(insights.budgetRemaining)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h3 className="font-semibold">Attachments</h3>
          {entryId ? (
            <>
              {!readOnly ? (
                <label className="mt-2 block cursor-pointer rounded-md border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">
                  {uploading ? "Uploading..." : "Drag/drop substitute: choose file"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      void onUpload(file)
                    }}
                  />
                </label>
              ) : null}
              <ul className="mt-3 space-y-2">
                {attachmentItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 rounded border border-slate-100 px-2 py-1.5">
                    <span className="truncate text-xs">{item.file_name}</span>
                    {!readOnly ? (
                      <button type="button" className="text-xs text-red-600" onClick={() => removeAttachment(item)}>
                        Delete
                      </button>
                    ) : null}
                  </li>
                ))}
                {attachmentItems.length === 0 ? <li className="text-xs text-slate-500">No attachments</li> : null}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Save entry first to upload files.</p>
          )}
        </div>
      </aside>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}
