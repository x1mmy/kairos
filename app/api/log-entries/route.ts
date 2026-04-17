import { z } from "zod"
import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-auth"

const entrySchema = z.object({
  period_id: z.string().uuid(),
  payee_id: z.string().uuid(),
  title: z.string().min(1),
  category: z.string().min(1),
  entry_date: z.string().min(1),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  quantity: z.coerce.number().min(0),
  unit_cost: z.coerce.number().min(0),
  status: z.enum(["draft", "ready"]),
})

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error

  const parsed = entrySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  }

  const { error, data } = await auth.supabase
    .from("log_entries")
    .insert({ ...parsed.data, created_by: auth.user!.id })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message, code: "INSERT_FAILED" }, { status: 400 })
  return NextResponse.json({ id: data.id })
}
