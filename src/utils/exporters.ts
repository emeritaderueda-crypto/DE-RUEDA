import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import writeXlsx from 'write-excel-file/browser';

// ----------------------------------------------------------------------
// 1. CSV EXPORTER (RFC-4180 compliant with UTF-8 BOM)
// ----------------------------------------------------------------------
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) =>
    row
      .map((val) => {
        const text = String(val ?? '');
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
          return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      })
      .join(',');

  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

// ----------------------------------------------------------------------
// 2. EXCEL XLSX EXPORTER (Real binary .xlsx workbook - Vulnerability-Free)
// ----------------------------------------------------------------------
export async function downloadExcelXLSX(
  filename: string,
  _sheetName: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const headerRow = headers.map((h) => ({
    value: h,
    fontWeight: 'bold' as const,
  }));

  const dataRows = rows.map((r) =>
    r.map((val) => {
      if (typeof val === 'number') {
        return { value: val, type: Number };
      }
      return { value: String(val ?? ''), type: String };
    })
  );

  const data = [headerRow, ...dataRows];
  const targetFileName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  try {
    const result = await writeXlsx(data as any, {
      sheet: _sheetName ? _sheetName.substring(0, 31) : 'Sheet 1',
    });
    if (typeof (result as any)?.toFile === 'function') {
      await (result as any).toFile(targetFileName);
    } else if (typeof (result as any)?.toBlob === 'function') {
      const blob = await (result as any).toBlob();
      triggerFileDownload(blob, targetFileName);
    }
  } catch (err) {
    console.warn('[XLSX Export Warning]: falling back to CSV export', err);
    downloadCSV(filename.replace(/\.xlsx$/i, '.csv'), [headers, ...rows]);
  }
}

export const downloadExcelXML = downloadExcelXLSX;

// ----------------------------------------------------------------------
// 3. WORD DOC EXPORTER (Formatted HTML Word Document)
// ----------------------------------------------------------------------
export function downloadWordDoc(filename: string, title: string, htmlContent: string) {
  const fullHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title)}</title>
  <style>
    body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; color: #111827; margin: 24px; }
    .header-box { border-bottom: 2pt solid #10b981; padding-bottom: 8px; margin-bottom: 16px; }
    .comp-name { color: #0F291E; font-size: 16pt; font-weight: bold; margin: 0; }
    .comp-sub { color: #065f46; font-size: 9pt; font-weight: bold; text-transform: uppercase; margin: 2px 0 0; }
    .meta-bar { font-size: 9pt; color: #6b7280; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 9.5pt; }
    th { background-color: #0F291E; color: #ffffff; padding: 7px 9px; text-align: left; border: 1px solid #1B4332; font-weight: bold; }
    td { padding: 6px 9px; border: 1px solid #d1d5db; vertical-align: top; }
    tr:nth-child(even) td { background-color: #f9fafb; }
    .footer { margin-top: 24px; font-size: 8pt; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="comp-name">DE RUEDA CONSTRUCTION</div>
    <div class="comp-sub">General Contractor & Infrastructure Builder &bull; Construction Management System</div>
    <div class="meta-bar">Document: <strong>${escapeXml(title)}</strong> | Generated: ${new Date().toLocaleString()}</div>
  </div>
  ${htmlContent}
  <div class="footer">
    Official System Document &bull; De Rueda Construction Management System &bull; ISO 9001 & DOLE Occupational Safety Compliant
  </div>
</body>
</html>`;

  const blob = new Blob(['\uFEFF' + fullHtml], { type: 'application/msword;charset=utf-8' });
  triggerFileDownload(blob, filename.endsWith('.doc') ? filename : `${filename}.doc`);
}

// ----------------------------------------------------------------------
// 4. PDF TABLE REPORT EXPORTER (Using jsPDF & autoTable)
// ----------------------------------------------------------------------
export function downloadReportPDF(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  landscape = false
) {
  const doc = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  // Header branding bar
  doc.setFillColor(15, 41, 30); // #0f291e
  doc.rect(0, 0, doc.internal.pageSize.width, 50, 'F');

  doc.setTextColor(163, 230, 53); // #a3e635
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('DE RUEDA CONSTRUCTION', 30, 24);

  doc.setTextColor(209, 250, 229); // #d1fae5
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ENTERPRISE MANAGEMENT SYSTEM · OFFICIAL VERIFIED REPORT', 30, 38);

  // Generation timestamp on right
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `DATE: ${new Date().toISOString().substring(0, 10)} | ${new Date().toLocaleTimeString()}`,
    doc.internal.pageSize.width - 30,
    30,
    { align: 'right' }
  );

  // Report title & context
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 30, 75);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(subtitle, 30, 90);

  // AutoTable data rendering
  autoTable(doc, {
    startY: 102,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [17, 24, 39],
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [15, 41, 30],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 30, right: 30, bottom: 40 },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Page ${doc.internal.pages.length - 1} | De Rueda Construction Confidential Document`;
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text(str, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 18, {
        align: 'center',
      });
    },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

// ----------------------------------------------------------------------
// 5. OFFICIAL BATCH PAYSLIPS PDF (Standard 6-Per-Page Printable Layout)
// ----------------------------------------------------------------------
export interface PayslipItemData {
  payroll_id: string;
  employee_id: string;
  name: string;
  position: string;
  site_id: string;
  week_key: string;
  daily_rate: number;
  verified_days: number;
  verified_hours: number;
  gross_pay: number;
  canteen: number;
  sss: number;
  philhealth: number;
  cash_advance: number;
  other_deduction: number;
  total_deductions: number;
  net_pay: number;
  payment_method: string;
  payment_status: string;
  reference_no: string;
}

export function downloadPayslipBatchPDF(
  filename: string,
  payslips: PayslipItemData[],
  weekKey: string,
  siteId: string
) {
  // A4 Page dimensions: 595.28 x 841.89 pt
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Grid setup: 2 columns x 3 rows = 6 payslips per page
  const cols = 2;
  const rows = 3;
  const perPage = cols * rows;

  const marginX = 24;
  const marginTop = 30;
  const marginBottom = 20;

  const cardWidth = (pageWidth - marginX * 2 - 14) / 2; // ~266 pt
  const cardHeight = (pageHeight - marginTop - marginBottom - 16) / 3; // ~254 pt
  const gapX = 14;
  const gapY = 8;

  let pageIndex = 0;

  for (let i = 0; i < payslips.length; i++) {
    const slotOnPage = i % perPage;
    if (slotOnPage === 0 && i !== 0) {
      doc.addPage();
      pageIndex++;
    }

    const colIdx = slotOnPage % cols;
    const rowIdx = Math.floor(slotOnPage / cols);

    const x = marginX + colIdx * (cardWidth + gapX);
    const y = marginTop + rowIdx * (cardHeight + gapY);

    const p = payslips[i];
    renderSinglePayslipCardOnPDF(doc, p, x, y, cardWidth, cardHeight);
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

function renderSinglePayslipCardOnPDF(
  doc: jsPDF,
  p: PayslipItemData,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Outer card boundary
  doc.setDrawColor(27, 67, 50); // #1b4332
  doc.setLineWidth(1.2);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 4, 4, 'FD');

  // Header band
  doc.setFillColor(15, 41, 30); // #0f291e
  doc.roundedRect(x, y, w, 28, 4, 4, 'F');
  doc.rect(x, y + 20, w, 8, 'F'); // square bottom of top band

  doc.setTextColor(163, 230, 53); // #a3e635
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DE RUEDA CONSTRUCTION', x + 8, y + 12);

  doc.setTextColor(209, 250, 229);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL WEEKLY PAYSLIP', x + 8, y + 21);

  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Wk: ${p.week_key}`, x + w - 8, y + 12, { align: 'right' });
  doc.text(`Ref: ${p.reference_no || 'N/A'}`, x + w - 8, y + 21, { align: 'right' });

  // Worker Info Block
  let cy = y + 40;
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(p.name, x + 8, cy);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(6, 95, 70);
  doc.text(`${p.position} · Site: ${p.site_id}`, x + 8, cy + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(p.employee_id, x + w - 8, cy, { align: 'right' });

  // Gross Pay Box
  cy += 20;
  doc.setFillColor(243, 244, 246);
  doc.rect(x + 6, cy, w - 12, 24, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(x + 6, cy, w - 12, 24, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Daily Rate: PHP ${p.daily_rate.toFixed(2)}`, x + 10, cy + 10);
  doc.text(
    `Verified: ${p.verified_days.toFixed(1)}d (${p.verified_hours.toFixed(1)}h)`,
    x + w - 10,
    cy + 10,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('GROSS EARNINGS:', x + 10, cy + 20);
  doc.text(`PHP ${p.gross_pay.toFixed(2)}`, x + w - 10, cy + 20, { align: 'right' });

  // Deductions List
  cy += 32;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('DEDUCTIONS & ADVANCES:', x + 8, cy);

  const deductLines = [
    { label: 'Canteen Meals', val: p.canteen },
    { label: 'SSS Contribution', val: p.sss },
    { label: 'PhilHealth Healthcare', val: p.philhealth },
    { label: 'Cash Advance (CA)', val: p.cash_advance },
    { label: 'Other / PPE Gear', val: p.other_deduction },
  ];

  cy += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  deductLines.forEach((item) => {
    doc.text(item.label, x + 8, cy);
    doc.text(item.val > 0 ? `PHP ${item.val.toFixed(2)}` : '-', x + w - 8, cy, {
      align: 'right',
    });
    cy += 8;
  });

  // Total deductions line
  doc.setDrawColor(209, 213, 219);
  doc.line(x + 8, cy, x + w - 8, cy);
  cy += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28); // red-700
  doc.text('TOTAL WITHHELD:', x + 8, cy);
  doc.text(`-PHP ${p.total_deductions.toFixed(2)}`, x + w - 8, cy, { align: 'right' });

  // Net Take Home Box (Emerald highlight)
  cy += 8;
  doc.setFillColor(236, 253, 245); // #ecfdf5
  doc.setDrawColor(16, 185, 129); // #10b981
  doc.setLineWidth(1);
  doc.roundedRect(x + 6, cy, w - 12, 22, 3, 3, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('NET TAKE-HOME PAY:', x + 10, cy + 14);

  doc.setFontSize(10);
  doc.text(`PHP ${p.net_pay.toFixed(2)}`, x + w - 10, cy + 15, { align: 'right' });

  // Acknowledgement Footer
  cy += 30;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Method: ${p.payment_method} (${p.payment_status})`, x + 8, cy);
  doc.text('Worker Signature: __________________', x + w - 8, cy, { align: 'right' });
}

// ----------------------------------------------------------------------
// 6. SINGLE INDIVIDUAL PAYSLIP PDF
// ----------------------------------------------------------------------
export function downloadSinglePayslipPDF(p: PayslipItemData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Single large card
  const margin = 24;
  const cardW = pageWidth - margin * 2;
  const cardH = pageHeight - margin * 2;

  renderSinglePayslipCardOnPDF(doc, p, margin, margin, cardW, cardH);
  doc.save(`DRC_Payslip_${p.employee_id}_${p.week_key}.pdf`);
}

// ----------------------------------------------------------------------
// 7. OFFICIAL WEEKLY DAILY TIME RECORD (DTR) EXPORTERS (PDF & CSV)
// ----------------------------------------------------------------------
export interface WeeklyDTREmployeeDay {
  date: string;
  dayName: string;
  timeIn: string;
  timeOut: string;
  breakMinutes: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  source: string;
  status: 'Present' | 'Rest Day' | 'Absent' | 'Incomplete';
  notes?: string;
}

export interface WeeklyDTREmployeeData {
  employee: {
    employee_id: string;
    name: string;
    position: string;
    site_id: string;
    daily_rate: number;
    email?: string;
    contact_number?: string;
  };
  siteName?: string;
  siteCode?: string;
  supervisor?: string;
  days: WeeklyDTREmployeeDay[];
  totalDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalHours: number;
  estimatedGrossPay: number;
}

export function downloadWeeklyDTRPDF(
  filename: string,
  weekKey: string,
  dateStart: string,
  dateEnd: string,
  dataList: WeeklyDTREmployeeData[]
) {
  // A4 Page dimensions: 595.28 x 841.89 pt
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  dataList.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Top Header Banner
    doc.setFillColor(15, 41, 30); // #0f291e
    doc.rect(0, 0, pageWidth, 54, 'F');

    // Accent line
    doc.setFillColor(163, 230, 53); // #a3e635
    doc.rect(0, 54, pageWidth, 2.5, 'F');

    // Company Title
    doc.setTextColor(163, 230, 53);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('DE RUEDA CONSTRUCTION', 28, 22);

    doc.setTextColor(209, 250, 229);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('GENERAL CONTRACTOR & INFRASTRUCTURE BUILDER · SYSTEM DTR ENGINE', 28, 34);
    doc.text('ISO 9001:2015 & DOLE OCCUPATIONAL SAFETY & HEALTH COMPLIANT', 28, 45);

    // Week & Metadata (Top Right)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`WEEK: ${weekKey}`, pageWidth - 28, 20, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(`COVERAGE: ${dateStart} to ${dateEnd}`, pageWidth - 28, 32, { align: 'right' });
    doc.text(`VERIFIED PHT (+08:00)`, pageWidth - 28, 43, { align: 'right' });

    // Document Title Banner
    let curY = 72;
    doc.setFillColor(243, 244, 246);
    doc.rect(28, curY, pageWidth - 56, 24, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(28, curY, pageWidth - 56, 24, 'S');

    doc.setTextColor(15, 41, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL WEEKLY DAILY TIME RECORD (DTR)', 38, curY + 16);

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`FORM DRC-DTR-${weekKey} · OFFICIAL EMPLOYEE RECORD`, pageWidth - 38, curY + 16, { align: 'right' });

    // Employee & Project Site Card
    curY += 32;
    const cardHeight = 62;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(27, 67, 50);
    doc.setLineWidth(0.8);
    doc.roundedRect(28, curY, pageWidth - 56, cardHeight, 4, 4, 'FD');

    // Left block: Employee Info
    doc.setTextColor(15, 41, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(item.employee.name, 38, curY + 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text(`TRADE/POSITION: ${item.employee.position.toUpperCase()}`, 38, curY + 31);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`ID KEY: ${item.employee.employee_id}   |   CONTACT: ${item.employee.contact_number || 'On Site'}`, 38, curY + 44);
    doc.text(`STANDARD SHIFT: 07:00 - 16:30 (90 min mandatory break rule)`, 38, curY + 54);

    // Right block: Project Site & Rate
    const col2X = pageWidth / 2 + 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 41, 30);
    doc.text(`PROJECT SITE: ${item.siteCode || item.employee.site_id}`, col2X, curY + 18);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Location: ${item.siteName || 'Construction Site Operations'}`, col2X, curY + 30);
    doc.text(`Site Supervisor: ${item.supervisor || 'Site Engineer In-Charge'}`, col2X, curY + 42);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`DAILY RATE: PHP ${item.employee.daily_rate.toFixed(2)} / DAY`, col2X, curY + 54);

    // Daily Attendance Grid via autoTable
    curY += cardHeight + 14;

    const tableHeaders = [
      'Date',
      'Day',
      'Time In',
      'Time Out',
      'Break Ded.',
      'Reg. Hrs',
      'OT Hrs',
      'Total Hrs',
      'Source / Verif.',
      'Daily Status',
    ];

    const tableBody = item.days.map((d) => [
      d.date,
      d.dayName,
      d.timeIn ? d.timeIn : '--:--',
      d.timeOut ? d.timeOut : '--:--',
      d.breakMinutes > 0 ? `${d.breakMinutes}m` : '0m',
      d.regularHours > 0 ? `${d.regularHours.toFixed(1)}h` : '-',
      d.overtimeHours > 0 ? `${d.overtimeHours.toFixed(1)}h` : '-',
      d.totalHours > 0 ? `${d.totalHours.toFixed(1)}h` : '0.0h',
      d.source || 'Pending',
      d.status,
    ]);

    // Footer summary row
    tableBody.push([
      'WEEKLY TOTALS',
      '',
      '',
      '',
      '90m breaks',
      `${item.totalRegularHours.toFixed(1)}h`,
      `${item.totalOvertimeHours.toFixed(1)}h`,
      `${item.totalHours.toFixed(1)} hrs`,
      'Verified Logs',
      `${item.totalDays} Days Present`,
    ]);

    autoTable(doc, {
      startY: curY,
      head: [tableHeaders],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 4.5,
        textColor: [17, 24, 39],
        lineColor: [209, 213, 219],
        lineWidth: 0.5,
        halign: 'center',
      },
      headStyles: {
        fillColor: [15, 41, 30],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 54 }, // Date
        1: { halign: 'center', fontStyle: 'bold', cellWidth: 38 }, // Day
        2: { halign: 'center', fontStyle: 'bold', textColor: [6, 95, 70], cellWidth: 46 }, // Time In
        3: { halign: 'center', fontStyle: 'bold', cellWidth: 46 }, // Time Out
        4: { halign: 'center', textColor: [107, 114, 128], cellWidth: 46 }, // Break
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 44 }, // Reg
        6: { halign: 'center', cellWidth: 40 }, // OT
        7: { halign: 'center', fontStyle: 'bold', textColor: [15, 41, 30], cellWidth: 48 }, // Total
        8: { halign: 'center', fontSize: 6.8, cellWidth: 64 }, // Source
        9: { halign: 'center', fontStyle: 'bold', cellWidth: 58 }, // Status
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      didParseCell: (data) => {
        // Highlight total row at the end
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fillColor = [236, 253, 245]; // light emerald
          data.cell.styles.textColor = [6, 95, 70];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 28, right: 28 },
    });

    // Compute end Y of the autoTable
    const autoTableDoc = doc as unknown as { lastAutoTable?: { finalY: number } };
    const tableEndY = autoTableDoc.lastAutoTable ? autoTableDoc.lastAutoTable.finalY : 380;

    // Summary Analytics & Wage Equivalent Box
    let summaryY = tableEndY + 12;
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.8);
    doc.roundedRect(28, summaryY, pageWidth - 56, 48, 3, 3, 'FD');

    doc.setTextColor(15, 41, 30);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('WEEKLY ATTENDANCE AUDIT & WAGE SUMMARY:', 38, summaryY + 16);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Verified Work Days: ${item.totalDays} Days   |   Total Net Work Hours: ${item.totalHours.toFixed(1)} hrs   |   Overtime: ${item.totalOvertimeHours.toFixed(1)} hrs`,
      38,
      summaryY + 30
    );
    doc.text(
      `Turnstile Break Rule: 90 mins deducted per full shift (10:00, 12:00, 15:00 intervals)`,
      38,
      summaryY + 41
    );

    // Right side estimated gross
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text(
      `ESTIMATED BASIC WAGE: PHP ${item.estimatedGrossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pageWidth - 38,
      summaryY + 22,
      { align: 'right' }
    );
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Calculation: ${item.totalDays} days × PHP ${item.employee.daily_rate.toFixed(2)}/day (Excl. Deductions)`,
      pageWidth - 38,
      summaryY + 36,
      { align: 'right' }
    );

    // Legal / Certification Paragraph
    let certY = summaryY + 62;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'I hereby certify on my honor that the above Daily Time Record is a true and correct record of the hours of work performed,',
      pageWidth / 2,
      certY,
      { align: 'center' }
    );
    doc.text(
      'arrival, and departure rendered at the designated construction project site for the payroll period stated.',
      pageWidth / 2,
      certY + 10,
      { align: 'center' }
    );

    // Signatures Section
    let sigY = certY + 30;
    const sigBoxWidth = (pageWidth - 56 - 28) / 2;

    // Worker signature
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.8);
    doc.line(38, sigY + 30, 38 + sigBoxWidth - 20, sigY + 30);

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(item.employee.name, 38 + (sigBoxWidth - 20) / 2, sigY + 42, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Employee / Worker Signature & Date', 38 + (sigBoxWidth - 20) / 2, sigY + 52, { align: 'center' });

    // In-charge / Supervisor verification
    const sig2Left = 28 + sigBoxWidth + 28;
    doc.line(sig2Left, sigY + 30, sig2Left + sigBoxWidth - 10, sigY + 30);

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(item.supervisor || 'PROJECT IN-CHARGE / TIMEKEEPER', sig2Left + (sigBoxWidth - 10) / 2, sigY + 42, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Site Engineer / Verified Authorized Sign-Off', sig2Left + (sigBoxWidth - 10) / 2, sigY + 52, { align: 'center' });

    // Official Footer
    doc.setFontSize(6.8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Official De Rueda Construction System Document · Generated: ${new Date().toLocaleString()} · Page ${index + 1} of ${dataList.length}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function downloadWeeklyDTRCSV(
  filename: string,
  weekKey: string,
  dateStart: string,
  dateEnd: string,
  dataList: WeeklyDTREmployeeData[]
) {
  const rows: (string | number)[][] = [];

  // Metadata headers
  rows.push(['# DE RUEDA CONSTRUCTION - OFFICIAL WEEKLY DAILY TIME RECORD (DTR) EXPORT']);
  rows.push([`# Payroll Week: ${weekKey} (${dateStart} to ${dateEnd})`]);
  rows.push([`# Total Employees in Export: ${dataList.length}`]);
  rows.push([`# Export Generated: ${new Date().toLocaleString()}`]);
  rows.push(['']);

  // Table Columns
  rows.push([
    'Employee ID',
    'Employee Name',
    'Position / Trade',
    'Site ID',
    'Site Name',
    'Daily Rate (PHP)',
    'Work Date',
    'Day of Week',
    'Time In',
    'Time Out',
    'Break Deduction (Mins)',
    'Regular Hours',
    'Overtime Hours',
    'Total Hours',
    'Verification Source',
    'Daily Status',
    'Remarks',
  ]);

  dataList.forEach((empData) => {
    empData.days.forEach((d) => {
      rows.push([
        empData.employee.employee_id,
        empData.employee.name,
        empData.employee.position,
        empData.employee.site_id,
        empData.siteName || '',
        empData.employee.daily_rate,
        d.date,
        d.dayName,
        d.timeIn || '',
        d.timeOut || '',
        d.breakMinutes,
        d.regularHours,
        d.overtimeHours,
        d.totalHours,
        d.source,
        d.status,
        d.notes || '',
      ]);
    });

    // Employee subtotal row
    rows.push([
      `SUMMARY [${empData.employee.employee_id}]`,
      empData.employee.name,
      `Days Worked: ${empData.totalDays}`,
      `Total Hours: ${empData.totalHours.toFixed(1)}`,
      `OT Hours: ${empData.totalOvertimeHours.toFixed(1)}`,
      `Est Gross Pay: PHP ${empData.estimatedGrossPay.toFixed(2)}`,
      '',
      '',
      '',
      '',
      '',
      empData.totalRegularHours,
      empData.totalOvertimeHours,
      empData.totalHours,
      'VERIFIED SUMMARY',
      `${empData.totalDays} Days Present`,
      `Rate: PHP ${empData.employee.daily_rate}/day`,
    ]);

    rows.push(['']); // Blank separator
  });

  downloadCSV(filename.endsWith('.csv') ? filename : `${filename}.csv`, rows);
}

// ----------------------------------------------------------------------
// HELPER UTILITIES
// ----------------------------------------------------------------------
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
