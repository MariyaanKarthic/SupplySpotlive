// Turns a built report into a flat layout (KPIs + tables) and writes it as CSV or PDF.
const { renderReportPdf } = require('./pdfReport');

const TITLES = {
  spend: 'Spend Analysis',
  suppliers: 'Supplier Performance Scorecard',
  delivery: 'Delivery Performance',
  'pr-approval': 'Purchase Requests & Approvals',
  'invoice-payment': 'Invoice & Payment Summary',
  compliance: 'Vendor Compliance Checklist',
};

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n, currency = 'INR') => (n === null || n === undefined ? '-' : `${currency === 'INR' ? '₹' : `${currency} `}${inr.format(Math.round(Number(n) || 0))}`);
const num = (n, suffix = '') => (n === null || n === undefined ? '-' : `${n}${suffix}`);
const plain = (v) => num(v);
const inrFmt = (v) => money(v);
const yes = (b) => (b ? 'Yes' : 'No');
const others = (list) => (list && list.length ? `Plus ${list.map((o) => `${o.currency} ${inr.format(o.amount)}`).join(', ')}` : '');
const STATUS = {
  on_time: 'On time', late: 'Late', open: 'In progress',
  certified: 'Certified', pending: 'Pending', non_compliant: 'Non-compliant',
  draft: 'Draft', submitted: 'Pending approval', approved: 'Approved', rejected: 'Rejected', paid: 'Paid', disputed: 'Disputed',
};
const label = (s) => STATUS[s] || s || '';

// Each table column: [label, value(row) for the PDF/CSV, width share, align]. CSV keeps raw numbers.
function layout(type, d) {
  const k = d.kpis;
  switch (type) {
    case 'spend':
      return {
        kpis: [
          { label: 'Total spend', value: money(k.totalSpend.amount), sub: `${k.totalSpend.count} committed POs ${others(k.totalSpend.others)}`.trim() },
          { label: 'Average order value', value: money(k.avgOrderValue.amount) },
          { label: 'Largest order', value: money(k.largestOrder?.amount), sub: k.largestOrder ? `${k.largestOrder.poNumber} · ${k.largestOrder.vendorName}` : '' },
          { label: 'Top 3 vendor share', value: num(k.supplierConcentration.pct, '%'), sub: k.supplierConcentration.vendors.join(', ') },
        ],
        tables: [
          { title: 'Spend by month', rows: d.byMonth, columns: [['Month', (r) => r.label, 2], ['POs', (r) => r.count, 1, 'right'], ['Spend (INR)', (r) => r.amount, 2, 'right', inrFmt]] },
          { title: 'Spend by category', rows: d.byCategory, columns: [['Category', (r) => r.name, 2], ['POs', (r) => r.count, 1, 'right'], ['Spend (INR)', (r) => r.amount, 2, 'right', inrFmt]] },
          { title: 'Spend by payment terms', rows: d.byPaymentTerms, columns: [['Payment terms', (r) => r.name, 3], ['POs', (r) => r.count, 1, 'right'], ['Spend (INR)', (r) => r.amount, 2, 'right', inrFmt]] },
          {
            title: 'Top vendors by spend', rows: d.topVendors,
            columns: [['Vendor', (r) => r.vendorName, 4], ['Category', (r) => r.category, 2], ['Total PO value', (r) => r.totalPoValue, 2, 'right', inrFmt], ['POs', (r) => r.poCount, 1, 'right'], ['Invoices', (r) => r.invoiceCount, 1, 'right'], ['Avg PO size', (r) => r.avgPoSize, 2, 'right', inrFmt], ['Share %', (r) => r.sharePct, 1, 'right']],
          },
          {
            title: 'All committed purchase orders', rows: d.orders,
            columns: [['PO', (r) => r.poNumber, 2], ['Issued', (r) => r.issueDate, 2], ['Vendor', (r) => r.vendorName, 4], ['Category', (r) => r.category, 2], ['Status', (r) => r.status, 2], ['Terms', (r) => r.terms, 3], ['Currency', (r) => r.currency, 1], ['Amount', (r) => r.amount, 2, 'right', (v, r) => money(v, r.currency)]],
          },
        ],
      };
    case 'suppliers':
      return {
        kpis: [
          { label: 'On-time delivery', value: num(k.onTimeRate.pct, '%'), sub: `${k.onTimeRate.onTime} on time, ${k.onTimeRate.late} late` },
          { label: 'Average lead time', value: num(k.avgLeadTime.days, ' days'), sub: `${k.avgLeadTime.count} deliveries` },
          { label: 'Average rating', value: num(k.qualityScore.rating, ' / 5'), sub: `${k.qualityScore.vendorCount} rated vendors` },
          { label: 'Repeat vendors', value: num(k.repeatVendors.pct, '%'), sub: `${k.repeatVendors.repeat} of ${k.repeatVendors.total} with 2+ POs` },
        ],
        tables: [{
          title: 'Vendor scorecard', note: 'Scores are 0–100. Quality = rating × 20; price = lowest quote ÷ vendor quote on shared RFQs; communication = sent POs acknowledged.', rows: d.scorecard,
          columns: [['Vendor', (r) => r.vendorName, 4], ['POs', (r) => r.poCount, 1, 'right'], ['Spend (INR)', (r) => r.spend, 2, 'right', inrFmt], ['Delivery %', (r) => r.deliveryRate, 1.5, 'right', plain], ['Lead time (d)', (r) => r.avgLeadTimeDays, 1.5, 'right', plain], ['Quality', (r) => r.qualityScore, 1.2, 'right', plain], ['Price', (r) => r.priceScore, 1.2, 'right', plain], ['Communication', (r) => r.communicationScore, 1.6, 'right', plain], ['Overall', (r) => r.overallScore, 1.2, 'right', plain]],
        }],
      };
    case 'delivery':
      return {
        kpis: [
          { label: 'On-time rate', value: num(k.onTimeRate.pct, '%'), sub: `${k.onTimeRate.onTime} of ${k.onTimeRate.due} due shipments` },
          { label: 'Average delay', value: num(k.avgDelay.days, ' days'), sub: `${k.avgDelay.count} late (${k.avgDelay.stillOpen} still open)` },
          { label: 'Exception rate', value: num(k.exceptionRate.pct, '%'), sub: `${k.exceptionRate.count} of ${k.exceptionRate.total} shipments` },
        ],
        tables: [
          { title: 'On time vs late by month', rows: d.trend, columns: [['Month', (r) => r.label, 2], ['On time', (r) => r.onTime, 1, 'right'], ['Late', (r) => r.late, 1, 'right'], ['In progress', (r) => r.open, 1, 'right'], ['On-time %', (r) => r.rate, 1, 'right', plain]] },
          { title: 'Delay reasons', rows: d.delayReasons, columns: [['Reason', (r) => r.name, 3], ['Late shipments', (r) => r.count, 1, 'right']] },
          { title: 'Performance by vendor', rows: d.byVendor, columns: [['Vendor', (r) => r.vendorName, 4], ['Shipments', (r) => r.total, 1, 'right'], ['On time', (r) => r.onTime, 1, 'right'], ['Late', (r) => r.late, 1, 'right'], ['On-time %', (r) => r.rate, 1, 'right', plain]] },
          {
            title: 'Shipments', rows: d.shipments,
            columns: [['Shipment', (r) => r.shipmentNumber, 2], ['PO', (r) => r.poNumber, 2], ['Vendor', (r) => r.vendorName, 3.5], ['Expected', (r) => r.expected, 1.6], ['Arrived', (r) => r.arrived, 1.6], ['Result', (r) => label(r.outcome), 1.4], ['Delay (d)', (r) => r.delayDays, 1, 'right'], ['Reason', (r) => r.reason ? (r.reason.text || r.reason.label) : '', 4]],
          },
        ],
      };
    case 'pr-approval':
      return {
        kpis: [
          { label: 'Purchase requests', value: num(k.totalPrs.count), sub: `Budget ${money(k.totalPrs.budget)}` },
          { label: 'Average approval time', value: num(k.avgApprovalTime.days, ' days'), sub: `${k.avgApprovalTime.count} decisions` },
          { label: 'Rejection rate', value: num(k.rejectionRate.pct, '%'), sub: `${k.rejectionRate.rejected} of ${k.rejectionRate.decided} decided` },
          { label: 'Slowest approver', value: k.bottleneck ? k.bottleneck.name : '-', sub: k.bottleneck ? `${k.bottleneck.avgDays} days avg over ${k.bottleneck.decisions}` : '' },
        ],
        tables: [
          { title: 'By department', rows: d.approvalTimeByDept, columns: [['Department', (r) => r.department, 3], ['Requests', (r) => r.total, 1, 'right'], ['Approved', (r) => r.approved, 1, 'right'], ['Rejected', (r) => r.rejected, 1, 'right'], ['Pending', (r) => r.pending, 1, 'right'], ['Avg approval (d)', (r) => r.avgDays, 1.5, 'right', plain], ['Budget (INR)', (r) => r.budget, 2, 'right', inrFmt]] },
          { title: 'Rejection reasons', rows: d.rejectionReasons, columns: [['Category', (r) => r.name, 2], ['Count', (r) => r.count, 1, 'right'], ['Examples', (r) => r.examples.map((e) => `${e.prNumber}: ${e.reason || '-'}`).join(' | '), 7]] },
          { title: 'Pending approvals', rows: d.pending, columns: [['PR', (r) => r.prNumber, 2], ['Title', (r) => r.title, 4], ['Requester', (r) => r.requester, 2], ['Department', (r) => r.department, 2], ['Days pending', (r) => r.daysPending, 1.4, 'right', plain], ['Approver', (r) => r.approver, 3]] },
          { title: 'All purchase requests', rows: d.requests, columns: [['PR', (r) => r.prNumber, 2], ['Title', (r) => r.title, 4], ['Status', (r) => label(r.status), 2], ['Department', (r) => r.department, 2], ['Submitted', (r) => r.submittedAt, 1.6], ['Decided', (r) => r.decidedAt, 1.6], ['Budget', (r) => r.budget, 2, 'right', (v, r) => money(v, r.currency)]] },
        ],
      };
    case 'invoice-payment':
      return {
        kpis: [
          { label: 'Total invoiced', value: money(k.totalInvoiced.amount), sub: `${k.totalInvoiced.count} invoices ${others(k.totalInvoiced.others)}`.trim() },
          { label: 'Paid on time', value: num(k.paidOnTime.pct, '%'), sub: `${k.paidOnTime.onTime} of ${k.paidOnTime.paid} paid invoices` },
          { label: 'Average payment delay', value: num(k.avgPaymentDelay.days, ' days'), sub: 'Days after due date (negative = early)' },
          { label: 'Days outstanding (DSO)', value: num(k.dso.days, ' days'), sub: `${money(k.dso.outstanding)} outstanding` },
        ],
        tables: [
          { title: 'Aging', rows: d.aging, columns: [['Bucket', (r) => r.label, 3], ['Invoices', (r) => r.count, 1, 'right'], ['Outstanding (INR)', (r) => r.amount, 2, 'right', inrFmt]] },
          { title: 'Payment status by month', rows: d.statusOverTime, columns: [['Month', (r) => r.label, 2], ['Invoices', (r) => r.count, 1, 'right'], ['Paid', (r) => r.paid, 2, 'right', inrFmt], ['Pending', (r) => r.pending, 2, 'right', inrFmt], ['Overdue', (r) => r.overdue, 2, 'right', inrFmt]] },
          { title: 'Payment trends by vendor', rows: d.byVendor, columns: [['Vendor', (r) => r.vendorName, 4], ['Invoices', (r) => r.invoices, 1, 'right'], ['Invoiced', (r) => r.invoiced, 2, 'right', inrFmt], ['Paid', (r) => r.paid, 2, 'right', inrFmt], ['Outstanding', (r) => r.outstanding, 2, 'right', inrFmt], ['On time %', (r) => r.onTimePct, 1.2, 'right', plain], ['Avg days to pay', (r) => r.avgDaysToPay, 1.5, 'right', plain]] },
          { title: 'Largest unpaid invoices', rows: d.largestUnpaid, columns: [['Invoice', (r) => r.invoiceNumber, 2], ['Vendor', (r) => r.vendorName, 4], ['PO', (r) => r.poNumber, 2], ['Due', (r) => r.dueDate, 1.6], ['Days overdue', (r) => r.daysOverdue, 1.3, 'right'], ['Outstanding', (r) => r.outstanding, 2, 'right', inrFmt]] },
          { title: 'All invoices', rows: d.invoices, columns: [['Invoice', (r) => r.invoiceNumber, 2], ['Vendor', (r) => r.vendorName, 4], ['Status', (r) => label(r.status), 1.5], ['Issued', (r) => r.issueDate, 1.6], ['Due', (r) => r.dueDate, 1.6], ['Paid on', (r) => r.paidOn, 1.6], ['Total', (r) => r.total, 2, 'right', (v, r) => money(v, r.currency)], ['Outstanding', (r) => r.outstanding, 2, 'right', (v, r) => money(v, r.currency)]] },
        ],
      };
    case 'compliance':
      return {
        kpis: [
          { label: 'Certification coverage', value: num(k.coverage.pct, '%'), sub: `${k.coverage.certified} of ${k.coverage.total} vendors certified` },
          { label: 'Audits due', value: num(k.auditsDue.count), sub: `${k.auditsDue.neverAudited} never audited, ${k.auditsDue.dueSoon} more due in 90 days` },
          { label: 'Open compliance issues', value: num(k.openIssues.count), sub: `${k.openIssues.vendors} vendors affected` },
          { label: 'Audits in period', value: num(k.auditsInPeriod.count), sub: `${k.auditsInPeriod.failed} failed` },
        ],
        tables: [
          { title: 'Certificates expiring in the next 90 days', rows: d.expiringSoon, columns: [['Vendor', (r) => r.vendorName, 4], ['Certificate', (r) => r.name, 3], ['Expires', (r) => r.date, 2], ['Days left', (r) => r.daysLeft, 1, 'right'], ['Verified', (r) => yes(r.verified), 1]] },
          {
            title: 'Vendor compliance checklist', rows: d.vendors,
            columns: [['Vendor', (r) => r.vendorName, 3.5], ['Status', (r) => label(r.status), 1.6], ['Level', (r) => r.levelLabel, 1.4], ['GST', (r) => yes(r.gstVerified), 0.7], ['PAN', (r) => yes(r.panVerified), 0.7], ['Certificates', (r) => r.certificates.map((c) => `${c.type}${c.expiryDate ? ` (${c.expiryDate})` : ''}`).join('; '), 4], ['Last audit', (r) => r.lastAudit, 1.5], ['Next due', (r) => r.nextAuditDue, 1.5], ['Issues', (r) => r.issues.join('; '), 4.5]],
          },
        ],
      };
    default:
      throw new Error(`Unknown report ${type}`);
  }
}

function describeRange(report) {
  const { from, to } = report.range;
  if (from && to) return `${from} to ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Up to ${to}`;
  return 'All time';
}

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function toCsv(type, report) {
  const { kpis, tables } = layout(type, report);
  const lines = [];
  const row = (cells) => lines.push(cells.map(csvCell).join(','));
  row([TITLES[type]]);
  row(['Period', describeRange(report)]);
  row(['Scope', report.scope.label]);
  row(['Generated', new Date().toISOString()]);
  lines.push('');
  row(['KPI', 'Value', 'Detail']);
  kpis.forEach((k) => row([k.label, k.value, k.sub || '']));
  for (const t of tables) {
    lines.push('');
    row([t.title]);
    row(t.columns.map((c) => c[0]));
    t.rows.forEach((r) => row(t.columns.map((c) => c[1](r))));
  }
  // BOM so Excel opens ₹ and other characters correctly.
  return `﻿${lines.join('\r\n')}\r\n`;
}

function toPdf(type, report) {
  const { kpis, tables } = layout(type, report);
  return renderReportPdf({
    title: TITLES[type],
    subtitle: `${describeRange(report)} · ${report.scope.label} · amounts in INR unless marked`,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    kpis,
    tables: tables.map((t) => ({
      title: t.title,
      note: t.note,
      columns: t.columns.map((c) => ({ label: c[0], width: c[2], align: c[3] })),
      rows: t.rows.map((r) => t.columns.map((c) => {
        const v = c[1](r);
        return c[4] ? c[4](v, r) : (v === null || v === undefined ? '' : v);
      })),
    })),
  });
}

const fileName = (type, report, ext) => `supplyspot-${type}-report-${report.range.from || 'start'}-to-${report.range.to || report.range.asOf}.${ext}`;

module.exports = { TITLES, toCsv, toPdf, fileName };
