import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function requireApiUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { supabase, error: NextResponse.json({ error: "Unauthenticated", code: "AUTH_REQUIRED" }, { status: 401 }) }
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  return { supabase, user, role: profile?.role as "admin" | "staff" | undefined, error: null as NextResponse | null }
}
