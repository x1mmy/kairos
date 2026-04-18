"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { validateImageAttachment } from "@/lib/attachment-images"
import { formatCurrency } from "@/lib/format"
import { useToast } from "@/components/ui/toast"

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
  insightData: {
    payeeTotalsByKey: Record<string, { invoiced: number; ready: number }>
    periodBudgets: Record<string, number>
    periodSpend: Record<string, number>
  }
  hasRequiredConfig?: boolean
  requiredConfigMessage?: string
}

export function EntryForm({
  mode,
  entryId,
  readOnly,
  defaults,
  payees,
  periods,
  attachments,
  insightData = { payeeTotalsByKey: {}, periodBudgets: {}, periodSpend: {} },
  hasRequiredConfig = true,
  requiredConfigMessage,
}: EntryFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { pushToast } = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savingMode, setSavingMode] = useState<"ready" | "draft" | null>(null)
  const [uploading, setUploading] = useState(false)
  const [attachmentItems, setAttachmentItems] = useState(attachments)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const form = useForm<FormValues>({
    defaultValues: defaults,
  })

  const quantity = form.watch("quantity")
  const unitCost = form.watch("unit_cost")
  const selectedPayeeId = form.watch("payee_id")
  const selectedPeriodId = form.watch("period_id")
  const lineTotal = useMemo(() => Number(quantity || 0) * Number(unitCost || 0), [quantity, unitCost])
  const insightKey = `${selectedPayeeId}|${selectedPeriodId}`
  const payeeInvoiced = insightData.payeeTotalsByKey[insightKey]?.invoiced ?? 0
  const payeeReady = insightData.payeeTotalsByKey[insightKey]?.ready ?? 0
  const periodBudget = insightData.periodBudgets[selectedPeriodId] ?? 0
  const periodSpent = insightData.periodSpend[selectedPeriodId] ?? 0
  const budgetRemaining = periodBudget - periodSpent
  const projectedRemaining = budgetRemaining - lineTotal

  useEffect(() => {
    if (searchParams.get("saved") !== "1") return
    pushToast(
      entryId ? "Entry saved. You can now upload attachments." : "Entry saved successfully.",
      "success",
    )
    router.replace(pathname)
  }, [entryId, pathname, pushToast, router, searchParams])

  const submit = form.handleSubmit(async (values) => {
    if (!hasRequiredConfig) {
      pushToast(requiredConfigMessage ?? "Please complete setup first.", "error")
      return
    }
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setSubmitError("Please check the form fields.")
      pushToast("Please check the form fields.", "error")
      return
    }
    setSubmitError(null)
    const statusToSave = savingMode ?? "ready"
    const endpoint = mode === "create" ? "/api/log-entries" : `/api/log-entries/${entryId}`
    const method = mode === "create" ? "POST" : "PATCH"
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...parsed.data, status: statusToSave }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setSubmitError(payload.error ?? "Save failed")
      pushToast(payload.error ?? "Save failed", "error")
      return
    }
    const id = mode === "create" ? payload.id : entryId
    window.location.href = id ? `/log/${id}?saved=1` : "/log"
  })

  const onUpload = async (file?: File) => {
    if (!file || !entryId) return
    const invalid = validateImageAttachment(file)
    if (invalid) {
      pushToast(invalid, "error")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch(`/api/entries/${entryId}/attachments`, {
      method: "POST",
      body: formData,
    })
    setUploading(false)
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      pushToast(payload.error ?? "Attachment upload failed.", "error")
      return
    }
    pushToast("Image uploaded.", "success")
    if (fileInputRef.current) fileInputRef.current.value = ""
    window.location.reload()
  }

  const removeAttachment = async (item: { id: string; storage_path: string; storage_bucket: string }) => {
    if (!entryId) return
    const confirmed = window.confirm("Delete this attachment?")
    if (!confirmed) return
    const response = await fetch(`/api/entries/${entryId}/attachments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachmentId: item.id,
        storagePath: item.storage_path,
        bucket: item.storage_bucket,
      }),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      pushToast(payload.error ?? "Attachment delete failed.", "error")
      return
    }
    pushToast("Attachment deleted.", "success")
    setAttachmentItems((prev) => prev.filter((row) => row.id !== item.id))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-5" onSubmit={submit}>
        <h2 className="text-lg font-semibold">{mode === "create" ? "New Entry" : "Edit Entry"}</h2>
        {!hasRequiredConfig ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {requiredConfigMessage ?? "You need at least one payee and one budget period before creating entries."}
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title">
            <input {...form.register("title")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Category">
            <input {...form.register("category")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Payee">
            <select {...form.register("payee_id")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm">
              {payees.length === 0 ? <option value="">No payees available</option> : null}
              {payees.map((payee) => (
                <option key={payee.id} value={payee.id}>
                  {payee.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Period">
            <select {...form.register("period_id")} disabled={readOnly} className="w-full rounded-md border px-3 py-2 text-sm">
              {periods.length === 0 ? <option value="">No budget periods available</option> : null}
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
          <input type="hidden" {...form.register("status")} />
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={!hasRequiredConfig}
              onClick={() => setSavingMode("ready")}
              className="rounded-md bg-slate-900 px-3 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
            >
              Save Entry
            </button>
            <button
              type="submit"
              disabled={!hasRequiredConfig}
              onClick={() => setSavingMode("draft")}
              className="rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
            >
              Save as Draft
            </button>
          </div>
        ) : null}
        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      </form>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h3 className="font-semibold">Summary</h3>
          <p className="mt-2">Line total: {formatCurrency(lineTotal)}</p>
          <p>Payee invoiced: {formatCurrency(payeeInvoiced)}</p>
          <p>Payee ready: {formatCurrency(payeeReady)}</p>
          <p>Budget remaining: {formatCurrency(budgetRemaining)}</p>
          <p className="text-xs text-slate-500">Projected remaining: {formatCurrency(projectedRemaining)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h3 className="font-semibold">Attachments</h3>
          {entryId ? (
            <>
              {!readOnly ? (
                <label className="mt-2 block min-h-[44px] cursor-pointer rounded-md border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">
                  {uploading ? "Uploading…" : "Tap to choose image (receipt, photo)"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
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
                  <li key={item.id} className="flex flex-col gap-2 rounded border border-slate-100 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex flex-col gap-1">
                      <span className="break-all text-xs font-medium text-slate-800">{item.file_name}</span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <a
                          className="text-slate-700 underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                          href={`/api/attachments/${item.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                        <span className="text-slate-300 select-none" aria-hidden>
                          |
                        </span>
                        <a
                          className="text-slate-700 underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                          href={`/api/attachments/${item.id}?download=1`}
                          rel="noreferrer"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                    {!readOnly ? (
                      <button
                        type="button"
                        className="self-start text-xs text-red-600 sm:self-center"
                        onClick={() => removeAttachment(item)}
                      >
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
