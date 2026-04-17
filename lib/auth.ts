import { redirect } from "next/navigation"
import { createAdminClient } from "@/utils/supabase/admin"
import { hasPasswordSession } from "@/lib/password-auth"

export type UserRole = "admin" | "staff"
const SYSTEM_PROFILE_ID = "00000000-0000-0000-0000-000000000001"

export async function getSessionUser() {
  if (!hasPasswordSession()) return null
  const supabase = createAdminClient()
  await supabase.from("profiles").upsert(
    {
      id: SYSTEM_PROFILE_ID,
      full_name: "Internal System Admin",
      role: "admin",
    },
    { onConflict: "id" },
  )
  return { id: SYSTEM_PROFILE_ID }
}

export async function getCurrentUserWithRole() {
  const supabase = createAdminClient()
  const user = await getSessionUser()
  if (!user) return { user: null, role: null as UserRole | null }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  return { user, role: (profile?.role as UserRole | undefined) ?? "staff" }
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  return user
}

export async function requireAdmin() {
  const { user, role } = await getCurrentUserWithRole()
  if (!user) redirect("/login")
  if (role !== "admin") redirect("/")
  return { user, role }
}
