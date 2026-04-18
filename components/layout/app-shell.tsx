"use client"

import { ReactNode, useState } from "react"
import { RefreshOnNavigate } from "@/components/layout/refresh-on-navigate"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { ToastProvider } from "@/components/ui/toast"

type AppShellProps = {
  userEmail?: string
  children: ReactNode
}

export function AppShell({ userEmail, children }: AppShellProps) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <ToastProvider>
      <RefreshOnNavigate />
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-[1440px]">
          <div className="hidden min-h-screen md:block">
            <Sidebar email={userEmail} />
          </div>

          {isMobileSidebarOpen ? (
            <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
              <div
                className="h-full w-72 max-w-[85vw] bg-white shadow-xl"
                onClick={(event) => {
                  event.stopPropagation()
                }}
              >
                <Sidebar email={userEmail} onNavigate={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              title="Kairos"
              subtitle="Internal invoicing and budget management"
              onMenuClick={() => setMobileSidebarOpen(true)}
            />
            <section className="flex-1 p-4 sm:p-5 md:p-6 lg:p-8">{children}</section>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
