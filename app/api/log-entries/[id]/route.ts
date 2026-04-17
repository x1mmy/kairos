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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error

  const parsed = entrySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  }

  const { data: current } = await auth.supabase.from("log_entries").select("status").eq("id", params.id).maybeSingle()
  if (current?.status === "invoiced") {
    return NextResponse.json({ error: "Invoiced entries are read-only", code: "READ_ONLY" }, { status: 400 })
  }

  const { error } = await auth.supabase.from("log_entries").update(parsed.data).eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message, code: "UPDATE_FAILED" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
