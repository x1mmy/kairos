"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"

type ProfileRow = {
  role: "admin" | "staff"
}

type UseUserResult = {
  user: User | null
  role: ProfileRow["role"] | null
  loading: boolean
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<ProfileRow["role"] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        setRole(null)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle<ProfileRow>()

      setRole(profile?.role ?? null)
      setLoading(false)
    }

    void loadUser()
  }, [])

  return { user, role, loading }
}
