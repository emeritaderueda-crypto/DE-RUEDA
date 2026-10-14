import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { Employee, Site } from '../../types';
import { generateQrDataUrl } from '../../utils/qrGenerator';
import {
  X,
  FileText,
  Printer,
  Download,
  Check,
  CheckSquare,
  Square,
  Search,
  Building,
  HardHat,
  Filter,
  ShieldCheck,
  Sparkles,
  Layers,
  AlertCircle,
  Clock,
  Scissors,
  CheckCircle2,
} from 'lucide-react';

interface BulkQrExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  sites: Site[];
  currentSite: string;
}

export type BulkQrLayout = 'grid_2x3' | 'grid_2x4' | 'grid_3x4';

export const BulkQrExportModal: React.FC<BulkQrExportModalProps> = ({
  isOpen,
  onClose,
  employees,
  sites,
  currentSite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState<string>(currentSite === 'ALL' ? 'ALL' : currentSite);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [layout, setLayout] = useState<BulkQrLayout>('grid_2x3');

  // Options
  const [includeCutLines, setIncludeCutLines] = useState(true);
  const [includeDoleHeader, setIncludeDoleHeader] = useState(true);
  const [includeRoleInfo, setIncludeRoleInfo] = useState(true);

  // Selected Employee IDs (default: select all filtered)
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    employees.map((e) => e.employee_id)
  );

  // PDF Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    empName: string;
    percentage: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (siteFilter !== 'ALL' && emp.site_id !== siteFilter) return false;
      if (categoryFilter !== 'ALL' && emp.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesId = emp.employee_id.toLowerCase().includes(q);
        const matchesPos = (emp.position || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPos) return false;
      }
      return true;
    });
  }, [employees, siteFilter, categoryFilter, searchTerm]);

  // Handle select all filtered
  const handleSelectAllFiltered = () => {
    const filteredSet = new Set(filteredEmployees.map((e) => e.employee_id));
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredSet])));
  };

  // Handle deselect all filtered
  const handleDeselectAllFiltered = () => {
    const filteredSet = new Set(filteredEmployees.map((e) => e.employee_id));
    setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
  };

  // Toggle single employee
  const handleToggleEmp = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Effective list of employees to include in PDF
  const targetEmployees = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return filteredEmployees.filter((emp) => selectedSet.has(emp.employee_id));
  }, [filteredEmployees, selectedIds]);

  // Layout parameters for A4 (210 x 297 mm)
  const layoutConfig = useMemo(() => {
    switch (layout) {
      case 'grid_2x3': // 6 badges per page (standard badge size)
        return {
          cols: 2,
          rows: 3,
          perPage: 6,
          cardWidth: 90,
          cardHeight: 80,
          marginX: 10,
          marginY: 20,
          gapX: 10,
          gapY: 8,
          qrSize: 34,
          label: 'Standard Badges (6 per page · 2×3)',
        };
      case 'grid_2x4': // 8 cards per page (pocket size)
        return {
          cols: 2,
          rows: 4,
          perPage: 8,
          cardWidth: 90,
          cardHeight: 60,
          marginX: 10,
          marginY: 20,
          gapX: 10,
          gapY: 6,
          qrSize: 28,
          label: 'Pocket Passes (8 per page · 2×4)',
        };
      case 'grid_3x4': // 12 cards per page (compact turnstile stickers)
        return {
          cols: 3,
          rows: 4,
          perPage: 12,
          cardWidth: 58,
          cardHeight: 60,
          marginX: 10,
          marginY: 20,
          gapX: 8,
          gapY: 6,
          qrSize: 26,
          label: 'Compact Turnstile Stickers (12 per page · 3×4)',
        };
    }
  }, [layout]);

  const estimatedPages = Math.max(1, Math.ceil(targetEmployees.length / layoutConfig.perPage));

  // Generate Multi-Employee Bulk QR PDF
  const handleGeneratePdf = async () => {
    if (targetEmployees.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setFeedback(null);
    setProgress({
      current: 0,
      total: targetEmployees.length,
      empName: 'Preparing document...',
      percentage: 0,
    });

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const totalItems = targetEmployees.length;
      const { cols, rows, perPage, cardWidth, cardHeight, marginX, marginY, gapX, gapY, qrSize } =
        layoutConfig;

      const totalPages = Math.ceil(totalItems / perPage);
      const siteObj = sites.find((s) => s.site_id === siteFilter);
      const siteLabel = siteObj ? `${siteObj.code} - ${siteObj.name}` : siteFilter === 'ALL' ? 'All Active Project Sites' : siteFilter;
      const printDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // Helper function to draw page header & footer
      const drawPageHeader = (pageNum: number) => {
        // Top banner background
        doc.setFillColor(14, 26, 22); // #0e1a16
        doc.rect(0, 0, 210, 14, 'F');

        // Header Title
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('DE RUEDA CONSTRUCTION (DRC) — OFFICIAL EMPLOYEE TURNSTILE QR BADGES', 10, 6.5);

        // Subheader line
        doc.setTextColor(163, 230, 53); // #a3e635
        doc.setFontSize(7);
        doc.setFont('courier', 'bold');
        doc.text(
          `SITE: ${siteLabel.toUpperCase()}  |  BATCH DATE: ${printDate}  |  DOLE 5-STAR SAFETY VERIFIED`,
          10,
          11
        );

        // Page numbering
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Page ${pageNum} of ${totalPages}`, 195, 8.5, { align: 'right' });

        // Accent strip under header
        doc.setFillColor(16, 185, 129); // #10b981
        doc.rect(0, 14, 210, 1, 'F');

        // Bottom footer banner
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(10, 287, 200, 287);
        doc.setLineDashPattern([], 0);

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.text(
          'Cut along dashed perimeter guidelines. Laminate with UV/Waterproof sleeve for outdoor site turnstiles. Anti-Duplicate QR v1.',
          10,
          291
        );
        doc.text(
          `Generated: ${new Date().toLocaleTimeString()} · Total Workers: ${totalItems}`,
          200,
          291,
          { align: 'right' }
        );
      };

      // Draw initial page header
      drawPageHeader(1);

      // Render cards
      for (let i = 0; i < totalItems; i++) {
        const emp = targetEmployees[i];
        const pageIndex = Math.floor(i / perPage);
        const indexOnPage = i % perPage;

        // If starting a new page (after first page)
        if (i > 0 && indexOnPage === 0) {
          doc.addPage();
          drawPageHeader(pageIndex + 1);
        }

        // Update progress
        setProgress({
          current: i + 1,
          total: totalItems,
          empName: emp.name,
          percentage: Math.round(((i + 1) / totalItems) * 100),
        });

        // Compute grid position
        const col = indexOnPage % cols;
        const row = Math.floor(indexOnPage / cols);
        const x = marginX + col * (cardWidth + gapX);
        const y = marginY + row * (cardHeight + gapY);

        // Draw Scissor Cut Guidelines (Dashed rectangle around card)
        if (includeCutLines) {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.25);
          doc.setLineDashPattern([2, 1.5], 0);
          doc.rect(x, y, cardWidth, cardHeight);
          doc.setLineDashPattern([], 0);
        } else {
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.rect(x, y, cardWidth, cardHeight);
        }

        // Card Top Header Bar
        doc.setFillColor(15, 41, 30); // Dark Green
        doc.rect(x, y, cardWidth, layout === 'grid_2x3' ? 8 : 6.5, 'F');

        doc.setTextColor(163, 230, 53); // #a3e635 Lime
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(layout === 'grid_3x4' ? 6 : 7.5);
        doc.text(
          'DE RUEDA CONSTRUCTION',
          x + cardWidth / 2,
          y + (layout === 'grid_2x3' ? 5 : 4.5),
          { align: 'center' }
        );

        // Generate QR code data URL
        const qrPayload = JSON.stringify({
          employee_id: emp.employee_id,
          qr_version: emp.qr_version || 1,
        });
        const qrDataUrl = await generateQrDataUrl(qrPayload, 300);

        if (layout === 'grid_2x3') {
          // Standard Badge Layout (2x3)
          // Left side: Text details
          // Worker Name
          doc.setTextColor(15, 23, 42); // slate-900
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          const truncatedName = emp.name.length > 20 ? emp.name.slice(0, 19) + '…' : emp.name;
          doc.text(truncatedName, x + 4, y + 14);

          // Worker ID
          doc.setTextColor(5, 150, 105); // emerald-600
          doc.setFont('courier', 'bold');
          doc.setFontSize(8.5);
          doc.text(emp.employee_id, x + 4, y + 19);

          // Position & Category
          if (includeRoleInfo) {
            doc.setTextColor(71, 85, 105); // slate-600
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            const truncatedPos = (emp.position || 'Laborer').length > 22
              ? (emp.position || 'Laborer').slice(0, 21) + '…'
              : emp.position || 'Laborer';
            doc.text(truncatedPos, x + 4, y + 24);

            doc.setTextColor(100, 116, 139);
            doc.setFontSize(6.5);
            doc.text(`Site: ${emp.site_id} · ${emp.category || 'Site'}`, x + 4, y + 28);
          }

          // Safety / DOLE Header
          if (includeDoleHeader) {
            doc.setFillColor(240, 253, 244); // emerald-50
            doc.rect(x + 4, y + 31, cardWidth - 8, 4.5, 'F');
            doc.setTextColor(22, 101, 52); // emerald-800
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            doc.text('DOLE 5-STAR VERIFIED · TURNSTILE GATE ACCESS', x + cardWidth / 2, y + 34.2, {
              align: 'center',
            });
          }

          // QR Code in Center
          const qrX = x + (cardWidth - qrSize) / 2;
          const qrY = y + 37;

          // QR Border box
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(16, 185, 129);
          doc.setLineWidth(0.4);
          doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 'FD');

          // Draw QR Image
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

          // Card Footer
          doc.setTextColor(100, 116, 139);
          doc.setFont('courier', 'bold');
          doc.setFontSize(5.5);
          doc.text(
            `HOLD TO SCANNER · VER: ${emp.qr_version || 1}`,
            x + cardWidth / 2,
            y + cardHeight - 2.5,
            { align: 'center' }
          );
        } else if (layout === 'grid_2x4') {
          // Pocket Passes Layout (2x4)
          // Left: Text / Right: QR
          const qrX = x + cardWidth - qrSize - 4;
          const qrY = y + 10;

          // QR Image
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(16, 185, 129);
          doc.setLineWidth(0.3);
          doc.rect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1, 'FD');
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

          // Left side text
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          const truncatedName = emp.name.length > 18 ? emp.name.slice(0, 17) + '…' : emp.name;
          doc.text(truncatedName, x + 3.5, y + 13);

          doc.setTextColor(5, 150, 105);
          doc.setFont('courier', 'bold');
          doc.setFontSize(8);
          doc.text(emp.employee_id, x + 3.5, y + 18);

          doc.setTextColor(71, 85, 105);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.text(emp.position || 'Laborer', x + 3.5, y + 23);
          doc.text(`Site: ${emp.site_id}`, x + 3.5, y + 27);

          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.text('PRESENT TO SCANNER', x + 3.5, y + 32);

          // Card Footer Strip
          doc.setFillColor(241, 245, 249);
          doc.rect(x, y + cardHeight - 5, cardWidth, 5, 'F');
          doc.setTextColor(100, 116, 139);
          doc.setFont('courier', 'bold');
          doc.setFontSize(5);
          doc.text(
            `DOLE 5-STAR · VER ${emp.qr_version || 1} · BIOMETRIC VERIFIED`,
            x + cardWidth / 2,
            y + cardHeight - 1.8,
            { align: 'center' }
          );
        } else {
          // Compact Turnstile Stickers (3x4)
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          const truncatedName = emp.name.length > 15 ? emp.name.slice(0, 14) + '…' : emp.name;
          doc.text(truncatedName, x + cardWidth / 2, y + 11, { align: 'center' });

          doc.setTextColor(5, 150, 105);
          doc.setFont('courier', 'bold');
          doc.setFontSize(7);
          doc.text(emp.employee_id, x + cardWidth / 2, y + 15, { align: 'center' });

          const qrX = x + (cardWidth - qrSize) / 2;
          const qrY = y + 17;

          doc.setFillColor(255, 255, 255);
          doc.rect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1, 'FD');
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

          doc.setTextColor(100, 116, 139);
          doc.setFont('courier', 'bold');
          doc.setFontSize(4.8);
          doc.text(
            `GATE SCAN · ${emp.site_id}`,
            x + cardWidth / 2,
            y + cardHeight - 2,
            { align: 'center' }
          );
        }

        // Small yield to UI thread so progress bar visibly animates
        if (i % 3 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      // Format clean filename
      const siteTag = siteFilter === 'ALL' ? 'ALL_SITES' : siteFilter;
      const dateTag = new Date().toISOString().slice(0, 10);
      const filename = `DRC_Bulk_Employee_QR_Badges_${siteTag}_${dateTag}.pdf`;

      // Save PDF to trigger native download
      doc.save(filename);

      setFeedback(
        `Successfully generated "${filename}" containing ${totalItems} printable QR codes across ${totalPages} page(s).`
      );
    } catch (err: any) {
      console.error('Failed to generate bulk QR PDF:', err);
      setFeedback(`PDF generation error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#234338] flex items-center justify-between bg-[#13241f]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-[#10b981] flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Bulk Export QR Badges (PDF)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
                  PRINT-READY PDF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate a single formatted PDF containing multiple employee turnstile QR codes for batch card and sticker printing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#234338] transition-colors cursor-pointer disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Feedback / Error Toast */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                feedback.includes('Successfully')
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              {feedback.includes('Successfully') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="flex-1">{feedback}</span>
            </div>
          )}

          {/* Active Generation Progress Bar */}
          {isGenerating && progress && (
            <div className="p-4 bg-[#13241f] border border-[#a3e635]/50 rounded-xl space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-[#a3e635] animate-spin" />
                  <span>Rendering PDF: {progress.empName}</span>
                </span>
                <span className="font-mono text-[#a3e635] font-bold">
                  {progress.current} of {progress.total} ({progress.percentage}%)
                </span>
              </div>

              <div className="w-full bg-[#080f0d] h-2.5 rounded-full overflow-hidden border border-[#234338]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#a3e635] transition-all duration-150"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Generating high-resolution QR matrix &amp; vector bounding boxes...</span>
                <span className="font-mono">Estimated ~{estimatedPages} pages</span>
              </div>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Layout Selection */}
            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-[#a3e635]" />
                  1. Print Grid Layout
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: 'grid_2x3',
                    title: 'Standard ID Badges',
                    desc: '6 per page (2×3) · 90×80mm for standard card sleeves',
                    badge: 'RECOMMENDED',
                  },
                  {
                    id: 'grid_2x4',
                    title: 'Pocket Attendance Passes',
                    desc: '8 per page (2×4) · 90×60mm for wallets / lanyards',
                    badge: 'COMPACT',
                  },
                  {
                    id: 'grid_3x4',
                    title: 'Turnstile Hard Hat Stickers',
                    desc: '12 per page (3×4) · 58×60mm adhesive stickers',
                    badge: 'HIGH-DENSITY',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLayout(item.id as BulkQrLayout)}
                    disabled={isGenerating}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      layout === item.id
                        ? 'bg-[#0e1a16] border-[#a3e635] shadow-xs'
                        : 'bg-[#080f0d]/50 border-[#234338] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          layout === item.id
                            ? 'bg-[#a3e635] text-[#080f0d]'
                            : 'bg-[#234338] text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Badge Formatting Options */}
            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3.5 space-y-3">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider text-[11px] text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                2. Badge Elements &amp; Cut Guides
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCutLines}
                    onChange={(e) => setIncludeCutLines(e.target.checked)}
                    disabled={isGenerating}
                    className="mt-0.5 accent-[#a3e635] rounded"
                  />
                  <div>
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Scissors className="w-3 h-3 text-[#a3e635]" />
                      Scissors Perimeter Cut Lines
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Renders dashed line guides around each badge for guillotine or scissors cutting
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDoleHeader}
                    onChange={(e) => setIncludeDoleHeader(e.target.checked)}
                    disabled={isGenerating}
                    className="mt-0.5 accent-[#a3e635] rounded"
                  />
                  <div>
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      DOLE 5-Star Safety Tag
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Includes official Department of Labor turnstile compliance notice on every pass
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRoleInfo}
                    onChange={(e) => setIncludeRoleInfo(e.target.checked)}
                    disabled={isGenerating}
                    className="mt-0.5 accent-[#a3e635] rounded"
                  />
                  <div>
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <HardHat className="w-3 h-3 text-sky-400" />
                      Role &amp; Site Tag
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Shows worker trade (e.g. Master Electrician) and assigned site code
                    </p>
                  </div>
                </label>
              </div>

              {/* Summary Box */}
              <div className="pt-2 border-t border-[#234338]/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Selected Workers:</span>
                  <span className="font-mono text-white font-bold">{targetEmployees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cards per Sheet:</span>
                  <span className="font-mono text-white font-bold">{layoutConfig.perPage}</span>
                </div>
                <div className="flex justify-between">
                  <span>Calculated Pages:</span>
                  <span className="font-mono text-[#a3e635] font-bold">{estimatedPages} A4 Page(s)</span>
                </div>
              </div>
            </div>

            {/* Column 3: Filters & Search */}
            <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3.5 space-y-3">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider text-[11px] text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                3. Filter Target Workforce
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Project Site Filter
                  </label>
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-2.5 py-1.5 bg-[#0e1a16] border border-[#234338] text-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#a3e635]"
                  >
                    <option value="ALL">All Project Sites ({employees.length} total)</option>
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Worker Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-2.5 py-1.5 bg-[#0e1a16] border border-[#234338] text-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#a3e635]"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Site-Based">Site-Based Construction</option>
                    <option value="Office">Office &amp; Engineering</option>
                    <option value="Subcontractor">Subcontractor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Search Name / ID / Role
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="e.g. Dela Cruz or DRC-MNL"
                      disabled={isGenerating}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-[#0e1a16] border border-[#234338] text-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#a3e635]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Worker Selection Checklist Table */}
          <div className="bg-[#13241f] border border-[#234338] rounded-xl overflow-hidden">
            <div className="p-3 bg-[#0e1a16] border-b border-[#234338] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Target Employees Checklist
                </span>
                <span className="px-2 py-0.5 bg-[#13241f] border border-[#234338] rounded-full text-[11px] font-mono text-slate-300">
                  {targetEmployees.length} of {filteredEmployees.length} Selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  disabled={isGenerating || filteredEmployees.length === 0}
                  className="px-2.5 py-1 bg-[#13241f] hover:bg-[#234338] text-slate-200 text-xs font-semibold rounded border border-[#234338] transition-colors cursor-pointer"
                >
                  Select All Filtered ({filteredEmployees.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  disabled={isGenerating || targetEmployees.length === 0}
                  className="px-2.5 py-1 bg-[#13241f] hover:bg-[#234338] text-slate-400 hover:text-white text-xs font-semibold rounded border border-[#234338] transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Scrollable Worker Grid */}
            <div className="max-h-60 overflow-y-auto divide-y divide-[#234338]/60">
              {filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No employees matched the selected site and search criteria.
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isChecked = selectedIds.includes(emp.employee_id);
                  return (
                    <div
                      key={emp.employee_id}
                      onClick={() => !isGenerating && handleToggleEmp(emp.employee_id)}
                      className={`p-2.5 px-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#0e1a16]/90 hover:bg-[#0e1a16]'
                          : 'bg-transparent hover:bg-[#13241f]/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className="text-slate-400 hover:text-white shrink-0"
                          tabIndex={-1}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#a3e635]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>

                        <div className="w-7 h-7 rounded-full bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[10px] font-bold text-[#a3e635] shrink-0">
                          {emp.photo_url ? (
                            <img
                              src={emp.photo_url}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            emp.name.slice(0, 2).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-white truncate flex items-center gap-2">
                            <span>{emp.name}</span>
                            <span className="font-mono text-[10px] text-emerald-400 font-semibold">
                              {emp.employee_id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                            <span>{emp.position || 'Construction Worker'}</span>
                            <span>&bull;</span>
                            <span>{emp.site_id}</span>
                            <span>&bull;</span>
                            <span>QR Ver {emp.qr_version || 1}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#080f0d] text-slate-400 border border-[#234338]">
                          {emp.category || 'Site-Based'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#234338] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#13241f]/80 shrink-0">
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-white">Batch Ready:</span>{' '}
            <span>
              {targetEmployees.length} employee badge(s) formatted for{' '}
              <strong className="text-[#a3e635]">{estimatedPages} A4 Page(s)</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isGenerating || targetEmployees.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-[#10b981] hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGenerating
                  ? 'Compiling PDF...'
                  : `Generate & Download PDF (${targetEmployees.length} Badges)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
