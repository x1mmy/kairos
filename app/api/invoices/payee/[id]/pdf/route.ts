import { NextResponse } from "next/server"
import { renderToStream } from "@react-pdf/renderer"
import { createElement } from "react"
import { requireApiUser } from "@/lib/api-auth"
import { PayeeInvoicePdf } from "@/lib/pdf-docs"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser()
  if (auth.error) return auth.error

  const { data: invoice } = await auth.supabase
    .from("payee_invoices")
    .select("id,invoice_number,subtotal_amount,gst_amount,total_amount,payee:payees(name)")
    .eq("id", params.id)
    .maybeSingle()
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found", code: "NOT_FOUND" }, { status: 404 })
  }
  const { data: lineItems } = await auth.supabase
    .from("invoice_line_items")
    .select("description,quantity,unit_cost,line_total")
    .eq("payee_invoice_id", params.id)

  const payee = Array.isArray(invoice.payee) ? invoice.payee[0] : invoice.payee
  const stream = await renderToStream(
    createElement(PayeeInvoicePdf as any, {
      invoiceNumber: invoice.invoice_number,
      payeeName: payee?.name ?? "Unknown",
      lineItems: (lineItems ?? []).map((row) => ({
        description: row.description,
        quantity: Number(row.quantity),
        unit_cost: Number(row.unit_cost),
        line_total: Number(row.line_total),
      })),
      subtotal: Number(invoice.subtotal_amount),
      gst: Number(invoice.gst_amount),
      total: Number(invoice.total_amount),
    }) as any,
  )

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: { "Content-Type": "application/pdf" },
  })
}
