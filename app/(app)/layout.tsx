import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { hasPasswordSession } from "@/lib/password-auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  if (!hasPasswordSession()) {
    redirect("/login")
  }

  return <AppShell userEmail="Internal User">{children}</AppShell>
}
