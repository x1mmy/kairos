import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  section: { marginTop: 14 },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #ddd", paddingVertical: 4 },
  cellWide: { width: "50%" },
  cell: { width: "16.6%" },
})

export function PayeeInvoicePdf({
  invoiceNumber,
  payeeName,
  lineItems,
  subtotal,
  gst,
  total,
}: {
  invoiceNumber: string
  payeeName: string
  lineItems: { description: string; quantity: number; unit_cost: number; line_total: number }[]
  subtotal: number
  gst: number
  total: number
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Kairos Payee Invoice</Text>
        <View style={styles.row}>
          <Text>Invoice: {invoiceNumber}</Text>
          <Text>Payee: {payeeName}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.tableRow}>
            <Text style={styles.cellWide}>Description</Text>
            <Text style={styles.cell}>Qty</Text>
            <Text style={styles.cell}>Unit</Text>
            <Text style={styles.cell}>Total</Text>
          </View>
          {lineItems.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.cellWide}>{item.description}</Text>
              <Text style={styles.cell}>{item.quantity.toFixed(2)}</Text>
              <Text style={styles.cell}>{item.unit_cost.toFixed(2)}</Text>
              <Text style={styles.cell}>{item.line_total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text>Subtotal: {subtotal.toFixed(2)}</Text>
          <Text>GST: {gst.toFixed(2)}</Text>
          <Text>Total: {total.toFixed(2)}</Text>
        </View>
      </Page>
    </Document>
  )
}

export function InternalSummaryPdf({
  summaryNumber,
  periodName,
  payees,
  total,
  budget,
  variance,
}: {
  summaryNumber: string
  periodName: string
  payees: { name: string; invoice_number: string; total_amount: number }[]
  total: number
  budget: number
  variance: number
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Kairos Internal Summary</Text>
        <Text>Summary: {summaryNumber}</Text>
        <Text>Period: {periodName}</Text>
        <View style={styles.section}>
          {payees.map((row, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.cellWide}>{row.name}</Text>
              <Text style={styles.cell}>{row.invoice_number}</Text>
              <Text style={styles.cell}>{row.total_amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text>Total spend: {total.toFixed(2)}</Text>
          <Text>Budget: {budget.toFixed(2)}</Text>
          <Text>Variance: {variance.toFixed(2)}</Text>
        </View>
      </Page>
    </Document>
  )
}
