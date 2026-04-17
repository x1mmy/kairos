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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  const parsed = payeeSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  }
  const { error } = await auth.supabase.from("payees").update(parsed.data).eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message, code: "UPDATE_FAILED" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
