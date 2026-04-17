import { z } from "zod"
import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-auth"

const schema = z.object({ role: z.enum(["admin", "staff"]) })

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  if (auth.role !== "admin") return NextResponse.json({ error: "Admin only", code: "FORBIDDEN" }, { status: 403 })
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  const { error } = await auth.supabase.from("profiles").update({ role: parsed.data.role }).eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message, code: "UPDATE_FAILED" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
