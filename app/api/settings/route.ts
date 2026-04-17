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
    const { startDate, endDate } = computePeriodWindow(
      parsed.data.budget.period_type,
      parsed.data.budget.period_start_day,
    )

    if (current) {
      const { error: updateError } = await auth.supabase
        .from("budget_periods")
        .update({
          period_type: parsed.data.budget.period_type,
          budget_amount: parsed.data.budget.budget_amount,
          currency: parsed.data.budget.currency,
          gst_rate: parsed.data.budget.gst_rate,
          start_date: startDate,
          end_date: endDate,
        })
        .eq("id", current.id)
      if (updateError) {
        return NextResponse.json({ error: updateError.message, code: "BUDGET_UPDATE_FAILED" }, { status: 400 })
      }
    } else {
      const { error: createError } = await auth.supabase.from("budget_periods").insert({
        name: `${parsed.data.budget.period_type[0].toUpperCase()}${parsed.data.budget.period_type.slice(1)} Budget`,
        period_type: parsed.data.budget.period_type,
        start_date: startDate,
        end_date: endDate,
        budget_amount: parsed.data.budget.budget_amount,
        currency: parsed.data.budget.currency,
        gst_rate: parsed.data.budget.gst_rate,
        is_current: true,
      })
      if (createError) {
        return NextResponse.json({ error: createError.message, code: "BUDGET_CREATE_FAILED" }, { status: 400 })
      }
    }
  }

  if (parsed.data.categories) {
    await auth.supabase.from("settings").upsert({ key: "categories", value: parsed.data.categories }, { onConflict: "key" })
  }

  return NextResponse.json({ ok: true })
}

function computePeriodWindow(
  periodType: "weekly" | "monthly" | "quarterly" | "yearly" | "custom",
  startDay: number,
) {
  const now = new Date()

  if (periodType === "weekly") {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { startDate: toDateString(start), endDate: toDateString(end) }
  }

  if (periodType === "monthly" || periodType === "custom") {
    const start = new Date(now.getFullYear(), now.getMonth(), Math.max(1, Math.min(28, startDay)))
    const end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate() - 1)
    return { startDate: toDateString(start), endDate: toDateString(end) }
  }

  if (periodType === "quarterly") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
    const start = new Date(now.getFullYear(), quarterStartMonth, Math.max(1, Math.min(28, startDay)))
    const end = new Date(start.getFullYear(), start.getMonth() + 3, start.getDate() - 1)
    return { startDate: toDateString(start), endDate: toDateString(end) }
  }

  const start = new Date(now.getFullYear(), 0, Math.max(1, Math.min(28, startDay)))
  const end = new Date(start.getFullYear() + 1, 0, start.getDate() - 1)
  return { startDate: toDateString(start), endDate: toDateString(end) }
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}
