"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useToast } from "@/components/ui/toast"

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  abn: z.string().optional(),
  default_category: z.string().optional(),
  rate_type: z.enum(["hourly", "fixed"]),
  default_rate: z.coerce.number().min(0),
  payment_terms: z.string().optional(),
  apply_gst: z.boolean(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function PayeeForm({
  mode,
  payeeId,
  defaults,
}: {
  mode: "create" | "edit"
  payeeId?: string
  defaults: FormValues
}) {
  const { pushToast } = useToast()
  const form = useForm<FormValues>({ defaultValues: defaults })
  const [error, setError] = useState<string | null>(null)

  const submit = form.handleSubmit(async (values) => {
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setError("Please check the form fields.")
      return
    }
    setError(null)
    const endpoint = mode === "create" ? "/api/payees" : `/api/payees/${payeeId}`
    const method = mode === "create" ? "POST" : "PATCH"
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error ?? "Save failed")
      pushToast(payload.error ?? "Save failed", "error")
      return
    }
    pushToast("Payee saved successfully.", "success")
    window.location.href = mode === "create" ? `/payees/${payload.id}` : `/payees/${payeeId}`
  })

  return (
    <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-5" onSubmit={submit}>
      <h2 className="text-lg font-semibold">{mode === "create" ? "New Payee" : "Edit Payee"}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name">
          <input {...form.register("name")} className="w-full rounded-md border px-3 py-2 text-sm" />
        </Field>
        <Field label="Email">
          <input {...form.register("email")} className="w-full rounded-md border px-3 py-2 text-sm" />
        </Field>
        <Field label="Address">
          <input {...form.register("address")} className="w-full rounded-md border px-3 py-2 text-sm" />
        </Field>
        <Field label="ABN">
          <input {...form.register("abn")} className="w-full rounded-md border px-3 py-2 text-sm" />
        </Field>
        <Field label="Default category">
          <input {...form.register("default_category")} className="w-full rounded-md border px-3 py-2 text-sm" />
        </Field>
        <Field label="Rate type">
          <select {...form.register("rate_type")} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="hourly">Hourly</option>
            <option value="fixed">Fixed</option>
          </select>
        </Field>
        <Field label="Default rate">
          <input type="number" step="0.01" {...form.register("default_rate")} className="w-full rounded-md border px-3 py-2 text-sm" />
        </Field>
        <Field label="Payment terms">
          <input {...form.register("payment_terms")} className="w-full rounded-md border px-3 py-2 text-sm" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("apply_gst")} />
        Apply GST
      </label>
      <Field label="Notes">
        <textarea {...form.register("notes")} className="w-full rounded-md border px-3 py-2 text-sm" rows={3} />
      </Field>
      <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
        Save Payee
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
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
