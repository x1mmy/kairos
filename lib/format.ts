const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number | null | undefined): string {
  return currencyFormatter.format(Number(value ?? 0))
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-"
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}
