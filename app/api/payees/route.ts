import { z } from "zod"
import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-auth"

const payeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  abn: z.string().optional(),
  default_category: z.string().optional(),
  rate_type: z.enum(["hourly", "fixed"]),
  default_rate: z.coerce.number().min(0),
  payment_terms: z.string().optional(),
  apply_gst: z.boolean(),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  const parsed = payeeSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  }
  const { data, error } = await auth.supabase.from("payees").insert(parsed.data).select("id").single()
  if (error) return NextResponse.json({ error: error.message, code: "INSERT_FAILED" }, { status: 400 })
  return NextResponse.json({ id: data.id })
}
