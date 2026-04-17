import { SettingsPage } from "@/components/settings/settings-page"
import { createClient } from "@/utils/supabase/server"
import { getCurrentUserWithRole } from "@/lib/auth"

export default async function SettingsRoutePage() {
  const supabase = createClient()
  await getCurrentUserWithRole()

  const [{ data: currentPeriod }, { data: categories }] = await Promise.all([
    supabase
      .from("budget_periods")
      .select("id,name,period_type,budget_amount,currency,gst_rate,start_date,end_date")
      .eq("is_current", true)
      .maybeSingle(),
    supabase.from("settings").select("value").eq("key", "categories").maybeSingle(),
  ])

  return (
    <SettingsPage
      initialBudget={{
        period_type: (currentPeriod?.period_type as "weekly" | "monthly" | "quarterly" | "yearly" | "custom") ?? "monthly",
        budget_amount: Number(currentPeriod?.budget_amount ?? 0),
        currency: currentPeriod?.currency ?? "AUD",
        gst_rate: Number(currentPeriod?.gst_rate ?? 0.1),
      }}
      currentPeriod={
        currentPeriod
          ? {
              id: currentPeriod.id,
              name: currentPeriod.name,
              start_date: currentPeriod.start_date,
              end_date: currentPeriod.end_date,
            }
          : null
      }
      initialCategories={Array.isArray(categories?.value) ? (categories?.value as string[]) : []}
    />
  )
}
