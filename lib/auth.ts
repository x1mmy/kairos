import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export type UserRole = "admin" | "staff"

export async function getSessionUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserWithRole() {
  const supabase = createClient()
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
