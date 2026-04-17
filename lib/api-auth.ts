import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAppPassword, PASSWORD_COOKIE_NAME } from "@/lib/password-auth"
import { createAdminClient } from "@/utils/supabase/admin"

const SYSTEM_PROFILE_ID = "00000000-0000-0000-0000-000000000001"

export async function requireApiUser() {
  const cookieValue = cookies().get(PASSWORD_COOKIE_NAME)?.value
  const expected = getAppPassword()
  const supabase = createAdminClient()

  if (!cookieValue || !expected || cookieValue !== expected) {
    return { supabase, error: NextResponse.json({ error: "Unauthenticated", code: "AUTH_REQUIRED" }, { status: 401 }) }
  }

  await supabase.from("profiles").upsert(
    {
      id: SYSTEM_PROFILE_ID,
      full_name: "Internal System Admin",
      role: "admin",
    },
    { onConflict: "id" },
  )

  const { data: actor } = await supabase.from("profiles").select("id,role").eq("id", SYSTEM_PROFILE_ID).maybeSingle()
  const role = (actor?.role as "admin" | "staff" | undefined) ?? "admin"

  return {
    supabase,
    user: { id: SYSTEM_PROFILE_ID },
    role,
    error: null as NextResponse | null,
  }
}
