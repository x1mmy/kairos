import { z } from "zod"
import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-auth"

const bodySchema = z.object({
  status: z.enum(["draft", "ready", "invoiced"]),
  ids: z.array(z.string().uuid()).optional(),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error

  const body = bodySchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  }

  const entryIds = params.id === "bulk" ? body.data.ids ?? [] : [params.id]
  if (entryIds.length === 0) {
    return NextResponse.json({ error: "No entry ids provided", code: "EMPTY_SELECTION" }, { status: 400 })
  }

  const { error } = await auth.supabase.from("log_entries").update({ status: body.data.status }).in("id", entryIds)
  if (error) {
    return NextResponse.json({ error: error.message, code: "UPDATE_FAILED" }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
