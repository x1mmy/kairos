import { NextResponse } from "next/server"
import { renderToStream } from "@react-pdf/renderer"
import { createElement } from "react"
import { requireApiUser } from "@/lib/api-auth"
import { InternalSummaryPdf } from "@/lib/pdf-docs"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  const { data: summary } = await auth.supabase
    .from("internal_summaries")
    .select("id,summary_number,total_spend,budget_amount,variance_amount,period:budget_periods(name, id)")
    .eq("id", params.id)
    .maybeSingle()
  if (!summary) return NextResponse.json({ error: "Summary not found", code: "NOT_FOUND" }, { status: 404 })
  const period = Array.isArray(summary.period) ? summary.period[0] : summary.period

  const { data: invoices } = await auth.supabase
    .from("payee_invoices")
    .select("invoice_number,total_amount,payee:payees(name)")
    .eq("period_id", period?.id)

  const stream = await renderToStream(
    createElement(InternalSummaryPdf as any, {
      summaryNumber: summary.summary_number,
      periodName: period?.name ?? "Unknown",
      payees: (invoices ?? []).map((row) => ({
        name:
          ((row.payee as any)?.name as string | undefined) ??
          (Array.isArray(row.payee) ? ((row.payee as any[])[0]?.name as string | undefined) : undefined) ??
          "Unknown",
        invoice_number: row.invoice_number,
        total_amount: Number(row.total_amount),
      })),
      total: Number(summary.total_spend),
      budget: Number(summary.budget_amount),
      variance: Number(summary.variance_amount),
    }) as any,
  )

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: { "Content-Type": "application/pdf" },
  })
}
