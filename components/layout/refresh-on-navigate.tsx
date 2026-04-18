"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef } from "react"

/**
 * Revalidates the current route after in-app navigation so Server Components
 * (e.g. Supabase reads) are not stuck behind a stale Router Cache payload.
 *
 * Keys on **pathname + query** so filter-only URL changes still revalidate.
 *
 * `router.refresh()` is deferred briefly so it does not race the in-flight
 * RSC navigation (which could briefly render empty lists or a stale dashboard).
 */
function RefreshOnNavigateInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isFirstRouteKeyEffect = useRef(true)
  const routeKey = `${pathname}?${searchParams.toString()}`

  useEffect(() => {
    if (isFirstRouteKeyEffect.current) {
      isFirstRouteKeyEffect.current = false
      return
    }
    const timeoutId = window.setTimeout(() => {
      router.refresh()
    }, 75)
    return () => window.clearTimeout(timeoutId)
  }, [routeKey, router])

  return null
}

export function RefreshOnNavigate() {
  return (
    <Suspense fallback={null}>
      <RefreshOnNavigateInner />
    </Suspense>
  )
}
