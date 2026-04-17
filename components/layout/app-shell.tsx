"use client"

import { ReactNode, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

type AppShellProps = {
  userEmail?: string
  children: ReactNode
}

export function AppShell({ userEmail, children }: AppShellProps) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <div className="hidden lg:block">
          <Sidebar email={userEmail} />
        </div>

        {isMobileSidebarOpen ? (
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
            <div
              className="h-full w-72 bg-white"
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
          <section className="flex-1 p-4 lg:p-8">{children}</section>
        </div>
      </div>
    </div>
  )
}
