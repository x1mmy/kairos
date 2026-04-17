import { SettingsPage } from "@/components/settings/settings-page"
import { createClient } from "@/utils/supabase/server"
import { getCurrentUserWithRole } from "@/lib/auth"

export default async function SettingsRoutePage() {
  const supabase = createClient()
  const { role } = await getCurrentUserWithRole()

  const [{ data: currentPeriod }, { data: invoiceConfig }, { data: categories }, { data: profiles }] = await Promise.all([
    supabase.from("budget_periods").select("period_type,budget_amount,currency,gst_rate").eq("is_current", true).maybeSingle(),
    supabase.from("settings").select("value").eq("key", "invoice_config").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "categories").maybeSingle(),
    supabase.from("profiles").select("id,full_name,role").order("created_at", { ascending: true }),
  ])

  return (
    <SettingsPage
      initialBudget={{
        period_type: (currentPeriod?.period_type as "weekly" | "monthly" | "quarterly" | "yearly" | "custom") ?? "monthly",
        budget_amount: Number(currentPeriod?.budget_amount ?? 0),
        currency: currentPeriod?.currency ?? "AUD",
        gst_rate: Number(currentPeriod?.gst_rate ?? 0.1),
      }}
      initialInvoice={(invoiceConfig?.value as Record<string, string> | null) ?? {}}
      initialCategories={Array.isArray(categories?.value) ? (categories?.value as string[]) : []}
      profiles={(profiles ?? []).map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role as "admin" | "staff",
      }))}
      isAdmin={role === "admin"}
    />
  )
}
