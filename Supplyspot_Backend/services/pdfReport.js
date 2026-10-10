// A small PDF writer for report exports: title, KPI tiles and paginated tables on landscape A4.
// Uses the built-in Helvetica fonts, so there is nothing to install; text is limited to Latin-1
// (₹ is written as "Rs." and other characters outside Latin-1 become "?").

const PAGE_W = 842;
const PAGE_H = 595;
const MARGIN = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Average Helvetica glyph widths (per 1pt of font size). Close enough for truncating cells.
const AVG = { regular: 0.5, bold: 0.55 };

function clean(text) {
  return String(text ?? '')
    .replace(/₹\s?/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/·/g, '-')
    .replace(/[^\x20-\x7e\xa0-\xff]/g, '?');
}
const escape = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const textWidth = (s, size, bold) => s.length * size * (bold ? AVG.bold : AVG.regular);

function fit(text, size, width, bold) {
  const s = clean(text);
  if (textWidth(s, size, bold) <= width) return s;
  const max = Math.max(1, Math.floor(width / (size * (bold ? AVG.bold : AVG.regular))) - 3);
  return `${s.slice(0, max)}...`;
}

class Page {
  constructor() { this.ops = []; }
  text(x, y, str, { size = 9, bold = false, color = [0.1, 0.1, 0.12] } = {}) {
    this.ops.push(`BT ${color.join(' ')} rg /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(1)} ${(PAGE_H - y).toFixed(1)} Td (${escape(str)}) Tj ET`);
  }
  rect(x, y, w, h, color) {
    this.ops.push(`${color.join(' ')} rg ${x.toFixed(1)} ${(PAGE_H - y - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`);
  }
  line(x1, y1, x2, y2, color = [0.85, 0.86, 0.88]) {
    this.ops.push(`${color.join(' ')} RG 0.5 w ${x1.toFixed(1)} ${(PAGE_H - y1).toFixed(1)} m ${x2.toFixed(1)} ${(PAGE_H - y2).toFixed(1)} l S`);
  }
}

/**
 * doc = {
 *   title, subtitle, generatedAt,
 *   kpis: [{ label, value, sub? }],
 *   tables: [{ title, note?, columns: [{ label, width (share), align? }], rows: [[cell, ...]] }]
 * }
 */
function renderReportPdf(doc) {
  const pages = [];
  let page;
  let y;
  const footer = (p, n) => {
    const grey = { size: 7, color: [0.5, 0.5, 0.55] };
    p.text(MARGIN, PAGE_H - 18, fit(`${doc.title} - generated ${doc.generatedAt}`, 7, CONTENT_W - 60), grey);
    p.text(PAGE_W - MARGIN - 40, PAGE_H - 18, `Page ${n} of ${pages.length}`, grey);
  };
  const newPage = () => { page = new Page(); pages.push(page); y = MARGIN; };
  const ensure = (h) => { if (y + h > PAGE_H - MARGIN - 10) { newPage(); return true; } return false; };

  newPage();
  page.text(MARGIN, y + 16, fit(doc.title, 18, CONTENT_W, true), { size: 18, bold: true });
  y += 26;
  if (doc.subtitle) { page.text(MARGIN, y + 10, fit(doc.subtitle, 9, CONTENT_W), { size: 9, color: [0.4, 0.4, 0.45] }); y += 16; }
  y += 8;

  // KPI tiles, four per row.
  const kpis = doc.kpis || [];
  const perRow = 4;
  const gap = 10;
  const tileW = (CONTENT_W - gap * (perRow - 1)) / perRow;
  for (let i = 0; i < kpis.length; i += perRow) {
    ensure(58);
    kpis.slice(i, i + perRow).forEach((k, j) => {
      const x = MARGIN + j * (tileW + gap);
      page.rect(x, y, tileW, 50, [0.96, 0.97, 0.98]);
      page.rect(x, y, 3, 50, [0.23, 0.51, 0.96]);
      page.text(x + 10, y + 14, fit(k.label, 8, tileW - 16), { size: 8, color: [0.4, 0.4, 0.45] });
      page.text(x + 10, y + 31, fit(k.value, 14, tileW - 16, true), { size: 14, bold: true });
      if (k.sub) page.text(x + 10, y + 44, fit(k.sub, 7, tileW - 16), { size: 7, color: [0.5, 0.5, 0.55] });
    });
    y += 60;
  }
  y += 6;

  for (const table of doc.tables || []) {
    const totalShare = table.columns.reduce((a, c) => a + (c.width || 1), 0);
    const widths = table.columns.map((c) => ((c.width || 1) / totalShare) * CONTENT_W);
    const rowH = 15;
    const header = () => {
      page.rect(MARGIN, y, CONTENT_W, rowH + 2, [0.93, 0.94, 0.96]);
      let x = MARGIN;
      table.columns.forEach((c, i) => {
        const label = fit(c.label, 8, widths[i] - 8, true);
        const tx = c.align === 'right' ? x + widths[i] - 4 - textWidth(label, 8, true) : x + 4;
        page.text(tx, y + 11, label, { size: 8, bold: true, color: [0.3, 0.3, 0.35] });
        x += widths[i];
      });
      y += rowH + 2;
    };

    ensure(60);
    page.text(MARGIN, y + 12, fit(table.title, 12, CONTENT_W, true), { size: 12, bold: true });
    y += 18;
    if (table.note) { page.text(MARGIN, y + 8, fit(table.note, 8, CONTENT_W), { size: 8, color: [0.45, 0.45, 0.5] }); y += 13; }
    header();
    if (!table.rows.length) {
      page.text(MARGIN + 4, y + 11, 'No records for this period.', { size: 8, color: [0.5, 0.5, 0.55] });
      y += rowH;
    }
    for (const row of table.rows) {
      if (ensure(rowH)) header();
      let x = MARGIN;
      row.forEach((cell, i) => {
        const c = table.columns[i] || {};
        const s = fit(cell, 8, widths[i] - 8);
        const tx = c.align === 'right' ? x + widths[i] - 4 - textWidth(s, 8) : x + 4;
        page.text(tx, y + 11, s, { size: 8 });
        x += widths[i];
      });
      page.line(MARGIN, y + rowH, MARGIN + CONTENT_W, y + rowH);
      y += rowH;
    }
    y += 16;
  }

  pages.forEach((p, i) => footer(p, i + 1));
  return assemble(pages);
}

function assemble(pages) {
  // Objects: 1 catalog, 2 pages, 3 F1, 4 F2, then a page + content stream per page.
  const objects = [];
  const kids = pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ');
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  pages.forEach((p, i) => {
    const stream = p.ops.join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
  });

  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

module.exports = { renderReportPdf };
