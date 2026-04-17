"use client"

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
      <p className="font-semibold">Something went wrong.</p>
      <p className="mt-1 text-sm">{error.message}</p>
      <button onClick={reset} className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-sm">
        Try again
      </button>
    </div>
  )
}
