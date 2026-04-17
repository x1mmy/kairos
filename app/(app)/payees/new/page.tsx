import { PayeeForm } from "@/components/payees/payee-form"

export default function NewPayeePage() {
  return (
    <PayeeForm
      mode="create"
      defaults={{
        name: "",
        email: "",
        address: "",
        abn: "",
        default_category: "",
        rate_type: "hourly",
        default_rate: 0,
        payment_terms: "",
        apply_gst: true,
        notes: "",
      }}
    />
  )
}
