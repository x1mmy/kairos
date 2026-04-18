import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { formatCurrency, formatDate } from "@/lib/format"
import { PayeeInvoiceStatusActions } from "@/components/invoices/status-actions"

export default async function PayeeInvoiceViewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [{ data: invoice }, { data: lineItems }, { data: attachments }] = await Promise.all([
    supabase
      .from("payee_invoices")
      .select("id,invoice_number,issued_date,subtotal_amount,gst_amount,total_amount,status,payee:payees(name,email,address,abn)")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("invoice_line_items")
      .select("id,description,quantity,unit_cost,line_total,log_entry_id")
      .eq("payee_invoice_id", params.id),
    supabase
      .from("attachments")
      .select("id,file_name,storage_path,storage_bucket,log_entry_id")
      .in(
        "log_entry_id",
        (
          await supabase.from("invoice_line_items").select("log_entry_id").eq("payee_invoice_id", params.id)
        ).data?.map((row) => row.log_entry_id) ?? [],
      ),
  ])

  if (!invoice) notFound()
  const payee = Array.isArray(invoice.payee) ? invoice.payee[0] : invoice.payee

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{invoice.invoice_number}</h2>
          <p className="text-sm text-slate-500">Issued {formatDate(invoice.issued_date)}</p>
        </div>
        <PayeeInvoiceStatusActions id={invoice.id} status={invoice.status} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Payee details</h3>
        <p className="mt-2">{payee?.name}</p>
        <p className="text-sm text-slate-600">{payee?.email}</p>
        <p className="text-sm text-slate-600">{payee?.address}</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[520px] text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(lineItems ?? []).map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="py-2">{item.description}</td>
                <td>{Number(item.quantity)}</td>
                <td>{formatCurrency(Number(item.unit_cost))}</td>
                <td>{formatCurrency(Number(item.line_total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <p>Subtotal: {formatCurrency(Number(invoice.subtotal_amount))}</p>
          <p>GST: {formatCurrency(Number(invoice.gst_amount))}</p>
          <p className="font-semibold">Total: {formatCurrency(Number(invoice.total_amount))}</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold">Attachments</h3>
          <a
            href={`/api/invoices/payee/${invoice.id}/pdf`}
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium sm:h-auto sm:py-1.5"
          >
            Download PDF
          </a>
        </div>
        <ul className="space-y-3 text-sm">
          {(attachments ?? []).map((attachment) => (
            <li key={attachment.id} className="rounded-md border border-slate-100 px-3 py-2">
              <p className="break-all font-medium text-slate-800">{attachment.file_name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <a
                  className="text-slate-700 underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                  href={`/api/attachments/${attachment.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
                <span className="text-slate-300 select-none" aria-hidden>
                  |
                </span>
                <a
                  className="text-slate-700 underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                  href={`/api/attachments/${attachment.id}?download=1`}
                  rel="noreferrer"
                >
                  Download
                </a>
              </div>
            </li>
          ))}
          {(attachments ?? []).length === 0 ? <li className="text-slate-500">No attachments linked.</li> : null}
        </ul>
      </section>
    </div>
  )
}
