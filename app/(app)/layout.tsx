import { unstable_noStore as noStore } from "next/cache"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { hasPasswordSession } from "@/lib/password-auth"

export const dynamic = "force-dynamic"
export const revalidate = 0
/** Default any `fetch()` in this segment to skip the Data Cache (Supabase uses its own client). */
export const fetchCache = "default-no-store"

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  noStore()

  if (!hasPasswordSession()) {
    redirect("/login")
  }

  return <AppShell userEmail="Kairos Team">{children}</AppShell>
}
