"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/toast"

type SettingsPageProps = {
  initialCategories: string[]
  initialBudget: {
    period_type: "weekly" | "monthly" | "quarterly" | "yearly" | "custom"
    budget_amount: number
    currency: string
    gst_rate: number
  }
  currentPeriod: {
    id: string
    name: string
    start_date: string
    end_date: string
  } | null
}

export function SettingsPage({
  initialCategories,
  initialBudget,
  currentPeriod,
}: SettingsPageProps) {
  const { pushToast } = useToast()
  const [categories, setCategories] = useState(initialCategories.join(", "))
  const [saving, setSaving] = useState(false)
  const [quickBudget, setQuickBudget] = useState(String(initialBudget.budget_amount || 1000))

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budget: {
          period_type: form.get("period_type"),
          budget_amount: Number(form.get("budget_amount")),
          period_start_day: Number(form.get("period_start_day")),
          currency: form.get("currency"),
          gst_rate: Number(form.get("gst_rate")),
        },
        categories: categories
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    })
    const payload = await response.json().catch(() => ({}))
    setSaving(false)
    if (!response.ok) {
      pushToast(payload.error ?? "Failed to save settings.", "error")
      return
    }
    pushToast("Settings saved successfully.", "success")
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Budget setup guide</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">
          <li>
            <strong>1)</strong> Pick your <em>period type</em> and start day.
          </li>
          <li>
            <strong>2)</strong> Enter total budget amount for that period.
          </li>
          <li>
            <strong>3)</strong> Click <em>Save settings</em> to create/update the current budget period.
          </li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          {["1000", "2500", "5000", "10000"].map((amount) => (
            <button
              key={amount}
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
              onClick={() => setQuickBudget(amount)}
            >
              Quick budget: ${amount}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Current period:{" "}
          {currentPeriod ? `${currentPeriod.name} (${currentPeriod.start_date} to ${currentPeriod.end_date})` : "Not created yet"}
        </p>
      </section>

      <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-slate-600">Budget config controls the active budget period used by Dashboard and Invoicing.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Period type">
            <select name="period_type" defaultValue={initialBudget.period_type} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </Field>
          <Field label="Budget amount">
            <input
              name="budget_amount"
              value={quickBudget}
              onChange={(event) => setQuickBudget(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Period start day">
            <input name="period_start_day" defaultValue={1} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Currency">
            <input name="currency" defaultValue={initialBudget.currency} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Default GST rate">
            <input name="gst_rate" defaultValue={initialBudget.gst_rate} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Tip: if this is your first time setup, saving here will automatically create the current period for you.
        </div>
        <Field label="Categories (comma-separated)">
          <input value={categories} onChange={(event) => setCategories(event.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        </Field>
        <button disabled={saving} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
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
