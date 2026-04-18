import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-auth"
import { createAdminClient } from "@/utils/supabase/admin"

function safeDownloadFilename(name: string | null): string {
  const base = (name ?? "attachment").trim() || "attachment"
  return base.replace(/[^\w.\-()+ ]/g, "_").slice(0, 200)
}

/**
 * Redirects to a short-lived signed URL. Omit `download=1` to open inline in the browser;
 * use `?download=1` to ask Storage for a Content-Disposition attachment response.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error

  const forceDownload = new URL(request.url).searchParams.get("download") === "1"

  const { data: row, error: fetchError } = await auth.supabase
    .from("attachments")
    .select("storage_bucket,storage_path,file_name")
    .eq("id", params.id)
    .maybeSingle()

  if (fetchError || !row) {
    return NextResponse.json({ error: "Attachment not found", code: "NOT_FOUND" }, { status: 404 })
  }

  const admin = createAdminClient()
  const signOptions = forceDownload ? { download: safeDownloadFilename(row.file_name) } : undefined
  const signedResult = signOptions
    ? await admin.storage.from(row.storage_bucket).createSignedUrl(row.storage_path, 120, signOptions)
    : await admin.storage.from(row.storage_bucket).createSignedUrl(row.storage_path, 120)

  const { data: signed, error: signError } = signedResult

  if (signError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: signError?.message ?? "Could not create download link", code: "SIGN_FAILED" },
      { status: 400 },
    )
  }

  return NextResponse.redirect(signed.signedUrl)
}
