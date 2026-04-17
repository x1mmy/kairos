import { NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-auth"
import { createAdminClient } from "@/utils/supabase/admin"

const deleteSchema = z.object({
  attachmentId: z.string().uuid(),
  storagePath: z.string().min(1),
  bucket: z.string().min(1).default("attachments"),
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file", code: "FILE_REQUIRED" }, { status: 400 })
  }

  const bucket = "attachments"
  const storagePath = `${params.id}/${Date.now()}-${file.name}`
  const admin = createAdminClient()
  const existingBuckets = await admin.storage.listBuckets()
  const hasBucket = (existingBuckets.data ?? []).some((item) => item.name === bucket)
  if (!hasBucket) {
    const createBucket = await admin.storage.createBucket(bucket, { public: false })
    if (createBucket.error) {
      return NextResponse.json({ error: createBucket.error.message, code: "BUCKET_CREATE_FAILED" }, { status: 400 })
    }
  }

  const upload = await admin.storage.from(bucket).upload(storagePath, file, { upsert: false })
  if (upload.error) {
    return NextResponse.json({ error: upload.error.message, code: "UPLOAD_FAILED" }, { status: 400 })
  }

  const { error } = await auth.supabase.from("attachments").insert({
    log_entry_id: params.id,
    storage_bucket: bucket,
    storage_path: storagePath,
    file_name: file.name,
    content_type: file.type,
    file_size_bytes: file.size,
    uploaded_by: auth.user!.id,
  })
  if (error) return NextResponse.json({ error: error.message, code: "ATTACHMENT_CREATE_FAILED" }, { status: 400 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  const parsed = deleteSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  }
  const admin = createAdminClient()
  await admin.storage.from(parsed.data.bucket).remove([parsed.data.storagePath])
  const { error } = await auth.supabase.from("attachments").delete().eq("id", parsed.data.attachmentId)
  if (error) return NextResponse.json({ error: error.message, code: "ATTACHMENT_DELETE_FAILED" }, { status: 400 })
  return NextResponse.json({ ok: true })
}
