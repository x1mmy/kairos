import { NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-auth"

const schema = z.object({
  nextName: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budgetAmount: z.coerce.number().min(0),
})

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Admin only", code: "FORBIDDEN" }, { status: 403 })
  }
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  }

  await auth.supabase.from("budget_periods").update({ is_current: false, is_closed: true }).eq("is_current", true)
  const { error } = await auth.supabase.from("budget_periods").insert({
    name: parsed.data.nextName,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    budget_amount: parsed.data.budgetAmount,
    is_current: true,
  })
  if (error) return NextResponse.json({ error: error.message, code: "ROLL_FAILED" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
