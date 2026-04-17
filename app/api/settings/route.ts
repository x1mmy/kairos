import { z } from "zod"
import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-auth"

const settingsSchema = z.object({
  budget: z
    .object({
      period_type: z.enum(["weekly", "monthly", "quarterly", "yearly", "custom"]),
      budget_amount: z.coerce.number().min(0),
      period_start_day: z.coerce.number().min(1).max(31),
      currency: z.string().default("AUD"),
      gst_rate: z.coerce.number().min(0),
    })
    .optional(),
  invoice: z
    .object({
      company_name: z.string().optional(),
      address: z.string().optional(),
      abn: z.string().optional(),
      default_payment_terms: z.string().optional(),
      invoice_number_prefix: z.string().optional(),
    })
    .optional(),
  categories: z.array(z.string()).optional(),
})

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  if (auth.role !== "admin") return NextResponse.json({ error: "Admin only", code: "FORBIDDEN" }, { status: 403 })
  const parsed = settingsSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })

  if (parsed.data.budget) {
    const { data: current } = await auth.supabase.from("budget_periods").select("id").eq("is_current", true).maybeSingle()
    if (current) {
      await auth.supabase
        .from("budget_periods")
        .update({
          period_type: parsed.data.budget.period_type,
          budget_amount: parsed.data.budget.budget_amount,
          currency: parsed.data.budget.currency,
          gst_rate: parsed.data.budget.gst_rate,
        })
        .eq("id", current.id)
    }
  }

  if (parsed.data.invoice) {
    await auth.supabase.from("settings").upsert({ key: "invoice_config", value: parsed.data.invoice }, { onConflict: "key" })
  }
  if (parsed.data.categories) {
    await auth.supabase.from("settings").upsert({ key: "categories", value: parsed.data.categories }, { onConflict: "key" })
  }

  return NextResponse.json({ ok: true })
}
