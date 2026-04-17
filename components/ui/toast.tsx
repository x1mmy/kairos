"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

type ToastItem = {
  id: number
  title: string
  variant: "success" | "error" | "info"
}

type ToastContextValue = {
  pushToast: (title: string, variant?: ToastItem["variant"]) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const pushToast = useCallback((title: string, variant: ToastItem["variant"] = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setItems((prev) => [...prev, { id, title, variant }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }, 3500)
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-md border px-3 py-2 text-sm shadow-md ${
              item.variant === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : item.variant === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {item.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
