"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

/**
 * After client navigation, the first RSC payload can briefly reflect a stale Router Cache
 * (e.g. “no current budget period” even though Settings already created one). A single
 * deferred `router.refresh()` re-runs Server Components for this route.
 */
export function DashboardMountRefresh() {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const id = window.setTimeout(() => {
      router.refresh()
    }, 60)
    return () => window.clearTimeout(id)
  }, [router])

  return null
}
