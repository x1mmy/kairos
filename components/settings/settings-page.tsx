"use client"

import { useState } from "react"

type SettingsPageProps = {
  initialCategories: string[]
  initialInvoice: Record<string, string>
  initialBudget: {
    period_type: "weekly" | "monthly" | "quarterly" | "yearly" | "custom"
    budget_amount: number
    currency: string
    gst_rate: number
  }
  profiles: { id: string; full_name: string | null; role: "admin" | "staff" }[]
  isAdmin: boolean
}

export function SettingsPage({ initialCategories, initialInvoice, initialBudget, profiles, isAdmin }: SettingsPageProps) {
  const [categories, setCategories] = useState(initialCategories.join(", "))
  const [inviteEmail, setInviteEmail] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    await fetch("/api/settings", {
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
        invoice: {
          company_name: form.get("company_name"),
          address: form.get("address"),
          abn: form.get("abn"),
          default_payment_terms: form.get("default_payment_terms"),
          invoice_number_prefix: form.get("invoice_number_prefix"),
        },
        categories: categories
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    })
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Settings</h2>
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
            <input name="budget_amount" defaultValue={initialBudget.budget_amount} className="w-full rounded-md border px-3 py-2 text-sm" />
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
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Company name">
            <input name="company_name" defaultValue={initialInvoice.company_name ?? ""} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Address">
            <input name="address" defaultValue={initialInvoice.address ?? ""} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="ABN">
            <input name="abn" defaultValue={initialInvoice.abn ?? ""} className="w-full rounded-md border px-3 py-2 text-sm" />
          </Field>
          <Field label="Default payment terms">
            <input
              name="default_payment_terms"
              defaultValue={initialInvoice.default_payment_terms ?? ""}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Invoice number prefix">
            <input
              name="invoice_number_prefix"
              defaultValue={initialInvoice.invoice_number_prefix ?? ""}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <Field label="Categories (comma-separated)">
          <input value={categories} onChange={(event) => setCategories(event.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        </Field>
        <button disabled={saving} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>

      {isAdmin ? (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold">Team</h3>
          <div className="flex gap-2">
            <input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="Invite email"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm"
              onClick={async () => {
                await fetch("/api/team/invite", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: inviteEmail }),
                })
                setInviteEmail("")
              }}
            >
              Invite
            </button>
          </div>
          <ul className="space-y-2">
            {profiles.map((profile) => (
              <li key={profile.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                <span>{profile.full_name ?? profile.id}</span>
                <select
                  value={profile.role}
                  onChange={async (event) => {
                    await fetch(`/api/team/${profile.id}/role`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role: event.target.value }),
                    })
                    window.location.reload()
                  }}
                  className="rounded-md border px-2 py-1 text-xs"
                >
                  <option value="admin">admin</option>
                  <option value="staff">staff</option>
                </select>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
