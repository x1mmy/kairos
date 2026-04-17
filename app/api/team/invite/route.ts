import { z } from "zod"
import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-auth"
import { createAdminClient } from "@/utils/supabase/admin"

const schema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  if (auth.role !== "admin") return NextResponse.json({ error: "Admin only", code: "FORBIDDEN" }, { status: 403 })
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email)
  if (error) return NextResponse.json({ error: error.message, code: "INVITE_FAILED" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
