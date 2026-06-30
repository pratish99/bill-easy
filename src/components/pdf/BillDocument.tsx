import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Bill } from '@/types';

const C = {
  primary: '#1a1a2e',
  accent: '#4f46e5',
  border: '#e5e7eb',
  gray: '#6b7280',
  lightBg: '#f3f4f6',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.primary,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
    letterSpacing: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  billNumber: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 6,
  },
  statusBadge: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Parties ─────────────────────────────────────────────────────────────────
  partiesRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  partyBox: {
    flex: 1,
    padding: 12,
    backgroundColor: C.lightBg,
    borderRadius: 4,
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 9,
    color: C.gray,
    marginBottom: 2,
  },

  // ── Dates ───────────────────────────────────────────────────────────────────
  datesRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dateBox: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
  },

  // ── Line Items Table ─────────────────────────────────────────────────────────
  table: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 3,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  colNum: { width: '5%' },
  colDesc: { flex: 1 },
  colQty: { width: '10%', textAlign: 'right' },
  colUnit: { width: '18%', textAlign: 'right' },
  colTotal: { width: '18%', textAlign: 'right' },
  cellText: { fontSize: 9, color: C.primary },
  cellMuted: { fontSize: 9, color: C.gray },

  // ── Summary ──────────────────────────────────────────────────────────────────
  summaryOuter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  summaryBox: { width: '45%' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  summaryLabel: { fontSize: 9, color: C.gray },
  summaryValue: { fontSize: 9, color: C.primary },
  summaryDiscount: { fontSize: 9, color: '#16a34a' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: C.accent,
    borderRadius: 4,
  },
  totalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white },
  totalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white },

  // ── Notes ────────────────────────────────────────────────────────────────────
  notes: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: C.lightBg,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  notesLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  notesText: { fontSize: 9, color: C.primary, lineHeight: 1.6 },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: C.gray },
});

const STATUS_COLORS: Record<string, string> = {
  paid: '#16a34a',
  sent: '#2563eb',
  cancelled: '#dc2626',
  draft: '#6b7280',
};

function currencyPrefix(currency: string): string {
  if (currency === 'INR') return 'Rs. ';
  if (currency === 'USD') return '$ ';
  if (currency === 'EUR') return 'EUR ';
  return `${currency} `;
}

function fmtAmount(amount: number): string {
  const [int, dec] = amount.toFixed(2).split('.');
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formatted}.${dec}`;
}

type Props = {
  bill: Bill;
  generatedAt: string;
};

export function BillDocument({ bill, generatedAt }: Props) {
  const prefix = currencyPrefix(bill.currency);
  const fmt = (n: number) => `${prefix}${fmtAmount(n)}`;
  const badgeColor = STATUS_COLORS[bill.status] ?? '#6b7280';

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <View style={styles.headerRight}>
            <Text style={styles.billNumber}>#{bill.billNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.statusText}>{bill.status}</Text>
            </View>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={styles.partiesRow}>
          <View style={[styles.partyBox, { marginRight: 12 }]}>
            <Text style={styles.partyLabel}>From</Text>
            <Text style={styles.partyName}>{bill.from.name}</Text>
            <Text style={styles.partyDetail}>{bill.from.address}</Text>
            {!!bill.from.phone && (
              <Text style={styles.partyDetail}>{bill.from.phone}</Text>
            )}
            {!!bill.from.email && (
              <Text style={styles.partyDetail}>{bill.from.email}</Text>
            )}
            {!!bill.from.gstin && (
              <Text style={styles.partyDetail}>GSTIN: {bill.from.gstin}</Text>
            )}
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>To</Text>
            <Text style={styles.partyName}>{bill.to.name}</Text>
            <Text style={styles.partyDetail}>{bill.to.address}</Text>
            {!!bill.to.phone && (
              <Text style={styles.partyDetail}>{bill.to.phone}</Text>
            )}
            {!!bill.to.email && (
              <Text style={styles.partyDetail}>{bill.to.email}</Text>
            )}
            {!!bill.to.gstin && (
              <Text style={styles.partyDetail}>GSTIN: {bill.to.gstin}</Text>
            )}
          </View>
        </View>

        {/* ── Dates ── */}
        <View style={styles.datesRow}>
          <View style={[styles.dateBox, { marginRight: 12 }]}>
            <Text style={styles.dateLabel}>Issue Date</Text>
            <Text style={styles.dateValue}>{bill.issueDate}</Text>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{bill.dueDate}</Text>
          </View>
        </View>

        {/* ── Line Items Table ── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNum]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>
          {bill.lineItems.map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                { backgroundColor: i % 2 === 0 ? C.white : C.lightBg },
              ]}
            >
              <Text style={[styles.cellMuted, styles.colNum]}>{i + 1}</Text>
              <Text style={[styles.cellText, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.cellText, styles.colUnit]}>{fmt(item.unitPrice)}</Text>
              <Text style={[styles.cellText, styles.colTotal]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* ── Summary ── */}
        <View style={styles.summaryOuter}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{fmt(bill.subtotal)}</Text>
            </View>
            {bill.taxRate > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax ({bill.taxRate}%)</Text>
                <Text style={styles.summaryValue}>{fmt(bill.taxAmount)}</Text>
              </View>
            )}
            {bill.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryDiscount}>-{fmt(bill.discount)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{fmt(bill.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ── */}
        {!!bill.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{bill.notes}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by Smart Billing</Text>
          <Text style={styles.footerText}>{generatedAt}</Text>
        </View>

      </Page>
    </Document>
  );
}
