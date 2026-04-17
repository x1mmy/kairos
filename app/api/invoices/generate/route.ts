import { z } from "zod"
import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-auth"

const schema = z.object({
  periodId: z.string().uuid(),
  entryIds: z.array(z.string().uuid()),
})

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", code: "VALIDATION_ERROR" }, { status: 400 })
  }

  const { periodId, entryIds } = parsed.data
  const { data: entries, error: entriesError } = await auth.supabase
    .from("log_entries")
    .select("id,payee_id,title,quantity,unit_cost,line_total")
    .in("id", entryIds)
    .eq("status", "ready")

  if (entriesError) return NextResponse.json({ error: entriesError.message, code: "FETCH_FAILED" }, { status: 400 })
  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: "No ready entries selected", code: "NO_ENTRIES" }, { status: 400 })
  }

  const groups = new Map<string, typeof entries>()
  for (const entry of entries) {
    if (!groups.has(entry.payee_id)) groups.set(entry.payee_id, [])
    groups.get(entry.payee_id)!.push(entry)
  }

  const generatedInvoiceIds: string[] = []
  let runningTotal = 0
  let invoiceCounter = 1

  for (const [payeeId, payeeEntries] of Array.from(groups.entries())) {
    const subtotal = payeeEntries.reduce((sum: number, row: (typeof payeeEntries)[number]) => sum + Number(row.line_total), 0)
    const gst = subtotal * 0.1
    const total = subtotal + gst
    runningTotal += total
    const invoiceNumber = `KAI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${invoiceCounter}`
    invoiceCounter += 1

    const { data: invoice, error: invoiceError } = await auth.supabase
      .from("payee_invoices")
      .insert({
        period_id: periodId,
        payee_id: payeeId,
        invoice_number: invoiceNumber,
        subtotal_amount: subtotal,
        gst_amount: gst,
        total_amount: total,
        status: "draft",
        created_by: auth.user!.id,
      })
      .select("id")
      .single()
    if (invoiceError) return NextResponse.json({ error: invoiceError.message, code: "INVOICE_CREATE_FAILED" }, { status: 400 })
    generatedInvoiceIds.push(invoice.id)

    const lineItems = payeeEntries.map((entry: (typeof payeeEntries)[number]) => ({
      payee_invoice_id: invoice.id,
      log_entry_id: entry.id,
      description: entry.title,
      quantity: Number(entry.quantity),
      unit_cost: Number(entry.unit_cost),
      line_total: Number(entry.line_total),
    }))
    const { error: lineError } = await auth.supabase.from("invoice_line_items").insert(lineItems)
    if (lineError) return NextResponse.json({ error: lineError.message, code: "LINE_ITEMS_FAILED" }, { status: 400 })
  }

  const { data: period } = await auth.supabase.from("budget_periods").select("budget_amount").eq("id", periodId).maybeSingle()
  const budgetAmount = Number(period?.budget_amount ?? 0)
  const varianceAmount = budgetAmount - runningTotal
  const percentOfBudget = budgetAmount > 0 ? runningTotal / budgetAmount : 0

  const { error: summaryError } = await auth.supabase.from("internal_summaries").insert({
    period_id: periodId,
    summary_number: `SUM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    total_spend: runningTotal,
    budget_amount: budgetAmount,
    variance_amount: varianceAmount,
    percent_of_budget: percentOfBudget,
    status: "draft",
    created_by: auth.user!.id,
  })
  if (summaryError) return NextResponse.json({ error: summaryError.message, code: "SUMMARY_CREATE_FAILED" }, { status: 400 })

  const { error: updateError } = await auth.supabase.from("log_entries").update({ status: "invoiced" }).in("id", entryIds)
  if (updateError) return NextResponse.json({ error: updateError.message, code: "ENTRY_UPDATE_FAILED" }, { status: 400 })

  return NextResponse.json({ ok: true, invoiceIds: generatedInvoiceIds })
}
