import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 42,
    fontSize: 10.5,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  brand: { fontSize: 12, letterSpacing: 1.1, color: "#334155" },
  title: { fontSize: 40, fontWeight: "bold", letterSpacing: 1.4, marginTop: 8 },
  metaLabel: { fontSize: 9, color: "#64748b", textTransform: "uppercase", marginBottom: 3 },
  metaValue: { fontSize: 11.5, fontWeight: "bold" },
  twoCol: { flexDirection: "row", gap: 18, marginBottom: 20 },
  colBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
  },
  colTitle: { fontSize: 9, color: "#64748b", textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.8 },
  colLine: { marginBottom: 2.5, fontSize: 10.5 },
  section: { marginTop: 12 },
  tableHeader: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 7,
    backgroundColor: "#f8fafc",
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0", paddingVertical: 7 },
  descCol: { width: "48%", paddingLeft: 8 },
  qtyCol: { width: "14%", textAlign: "right", paddingRight: 8 },
  unitCol: { width: "19%", textAlign: "right", paddingRight: 8 },
  amountCol: { width: "19%", textAlign: "right", paddingRight: 8 },
  totalsWrap: { alignSelf: "flex-end", width: 240, marginTop: 14 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalLabel: { color: "#475569", fontSize: 10.5 },
  totalValue: { fontSize: 10.5 },
  grandTotalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderColor: "#0f172a",
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 11.5, fontWeight: "bold", letterSpacing: 0.6 },
  grandTotalValue: { fontSize: 13, fontWeight: "bold" },
  footer: { marginTop: 28, borderTopWidth: 1, borderColor: "#e2e8f0", paddingTop: 10, color: "#64748b", fontSize: 9.5 },
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
  const issueDate = new Date().toISOString().slice(0, 10)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.brand}>KAIROS</Text>
            <Text style={styles.title}>INVOICE</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Invoice Number</Text>
            <Text style={styles.metaValue}>{invoiceNumber}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Issue Date</Text>
            <Text style={styles.metaValue}>{issueDate}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.colBox}>
            <Text style={styles.colTitle}>Billed To</Text>
            <Text style={styles.colLine}>{payeeName}</Text>
          </View>
          <View style={styles.colBox}>
            <Text style={styles.colTitle}>From</Text>
            <Text style={styles.colLine}>Kairos Internal Finance</Text>
            <Text style={styles.colLine}>Internal invoicing and budget management</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.descCol}>Description</Text>
            <Text style={styles.qtyCol}>Qty</Text>
            <Text style={styles.unitCol}>Unit</Text>
            <Text style={styles.amountCol}>Amount</Text>
          </View>
          {lineItems.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.descCol}>{item.description}</Text>
              <Text style={styles.qtyCol}>{item.quantity.toFixed(2)}</Text>
              <Text style={styles.unitCol}>{formatCurrency(item.unit_cost)}</Text>
              <Text style={styles.amountCol}>{formatCurrency(item.line_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Sub-total</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>GST</Text>
            <Text style={styles.totalValue}>{formatCurrency(gst)}</Text>
          </View>
          <View style={styles.grandTotalLine}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Payment terms apply as agreed with the payee. Please include invoice number in all payment remittance.
        </Text>
      </Page>
    </Document>
  )
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}
