import { NextResponse } from "next/server"
import { z } from "zod"
import { isPasswordValid, setPasswordSessionCookie } from "@/lib/password-auth"

const schema = z.object({
  password: z.string().min(1),
  next: z.string().optional(),
})

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  }

  if (!isPasswordValid(parsed.data.password)) {
    return NextResponse.json({ error: "Incorrect password", code: "INVALID_CREDENTIALS" }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, next: parsed.data.next ?? "/" })
  setPasswordSessionCookie(response)
  return response
}
