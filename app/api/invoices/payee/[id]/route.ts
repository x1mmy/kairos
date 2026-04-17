import { NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-auth"

const schema = z.object({ status: z.enum(["draft", "issued", "paid", "cancelled"]) })

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  const values: Record<string, unknown> = { status: parsed.data.status }
  if (parsed.data.status === "issued") values.issued_date = new Date().toISOString().slice(0, 10)
  const { error } = await auth.supabase.from("payee_invoices").update(values).eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message, code: "UPDATE_FAILED" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
