import { notFound } from "next/navigation"
import { PayeeForm } from "@/components/payees/payee-form"
import { createClient } from "@/utils/supabase/server"
import { formatCurrency, formatDate } from "@/lib/format"

export default async function EditPayeePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [{ data: payee }, { data: invoiceHistory }] = await Promise.all([
    supabase
      .from("payees")
      .select("id,name,email,address,abn,default_category,rate_type,default_rate,payment_terms,apply_gst,notes")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("payee_invoices")
      .select("id,invoice_number,issued_date,total_amount,status")
      .eq("payee_id", params.id)
      .order("created_at", { ascending: false }),
  ])

  if (!payee) notFound()

  return (
    <div className="space-y-6">
      <PayeeForm
        mode="edit"
        payeeId={payee.id}
        defaults={{
          name: payee.name,
          email: payee.email ?? "",
          address: payee.address ?? "",
          abn: payee.abn ?? "",
          default_category: payee.default_category ?? "",
          rate_type: payee.rate_type,
          default_rate: Number(payee.default_rate),
          payment_terms: payee.payment_terms ?? "",
          apply_gst: payee.apply_gst,
          notes: payee.notes ?? "",
        }}
      />
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold">Invoice history</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Invoice</th>
                <th>Issued</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(invoiceHistory ?? []).map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="py-2">{invoice.invoice_number}</td>
                  <td>{formatDate(invoice.issued_date)}</td>
                  <td>{formatCurrency(Number(invoice.total_amount))}</td>
                  <td className="capitalize">{invoice.status}</td>
                </tr>
              ))}
              {(invoiceHistory ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No invoices yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
