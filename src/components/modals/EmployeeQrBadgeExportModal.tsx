import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { generateSvgQRCode, generateQrDataUrl } from '../../utils/qrGenerator';
import {
  X,
  Search,
  Download,
  Printer,
  Copy,
  Check,
  QrCode,
  HardHat,
  ShieldCheck,
  Building,
  RefreshCw,
  Sparkles,
  Users,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface EmployeeQrBadgeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmployeeId?: string | null;
}

export const EmployeeQrBadgeExportModal: React.FC<EmployeeQrBadgeExportModalProps> = ({
  isOpen,
  onClose,
  initialEmployeeId,
}) => {
  const { employees, sites } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialEmployeeId && employees.some((e) => e.employee_id === initialEmployeeId)) {
      return initialEmployeeId;
    }
    return employees[0]?.employee_id || '';
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync initialEmployeeId if opened with a specific employee
  React.useEffect(() => {
    if (initialEmployeeId && employees.some((e) => e.employee_id === initialEmployeeId)) {
      setSelectedId(initialEmployeeId);
    }
  }, [initialEmployeeId, employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (siteFilter !== 'ALL' && emp.site_id !== siteFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesId = emp.employee_id.toLowerCase().includes(q);
        const matchesPos = (emp.position || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPos) return false;
      }
      return true;
    });
  }, [employees, siteFilter, searchTerm]);

  // Active selected employee
  const selectedEmp = useMemo(() => {
    return employees.find((e) => e.employee_id === selectedId) || employees[0];
  }, [employees, selectedId]);

  // Resolved site object
  const selectedSite = useMemo(() => {
    if (!selectedEmp) return null;
    return sites.find((s) => s.site_id === selectedEmp.site_id);
  }, [selectedEmp, sites]);

  // QR Code payload
  const qrPayload = useMemo(() => {
    if (!selectedEmp) return '';
    return JSON.stringify({
      employee_id: selectedEmp.employee_id,
      qr_version: selectedEmp.qr_version || 1,
    });
  }, [selectedEmp]);

  // SVG QR Code
  const qrSvg = useMemo(() => {
    if (!qrPayload) return '';
    return generateSvgQRCode(qrPayload, 200);
  }, [qrPayload]);

  if (!isOpen || !selectedEmp) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render high-resolution PNG badge onto a canvas and trigger file download
  const renderBadgeToCanvas = async (emp: Employee): Promise<string> => {
    const site = sites.find((s) => s.site_id === emp.site_id);
    const siteName = site ? `${site.code} - ${site.name}` : (emp.site_id || 'Primary Project Site');
    const payload = JSON.stringify({
      employee_id: emp.employee_id,
      qr_version: emp.qr_version || 1,
    });
    const qrDataUrl = await generateQrDataUrl(payload, 450);

    const canvas = document.createElement('canvas');
    canvas.width = 650;
    canvas.height = 920;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    // Deep slate-black badge background
    ctx.fillStyle = '#080f0d';
    ctx.fillRect(0, 0, 650, 920);

    // Outer border
    ctx.strokeStyle = '#234338';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 626, 896);

    // Top Header Banner
    ctx.fillStyle = '#0e1a16';
    ctx.fillRect(15, 15, 620, 130);

    // Lime accent line
    ctx.fillStyle = '#a3e635';
    ctx.fillRect(15, 142, 620, 5);

    // Brand Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 26px sans-serif';
    ctx.fillText('DE RUEDA CONSTRUCTION', 36, 62);

    // Header sub-badge
    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('OFFICIAL TURNSTILE ATTENDANCE BADGE · DOLE COMPLIANT', 36, 96);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('Authorized Biometric Field Access Credential', 36, 120);

    // Worker Photo or Initial Avatar
    const avatarX = 36;
    const avatarY = 175;
    const avatarSize = 100;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (emp.photo_url) {
      try {
        const photoImg = new Image();
        photoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          photoImg.onload = () => {
            ctx.drawImage(photoImg, avatarX, avatarY, avatarSize, avatarSize);
            resolve();
          };
          photoImg.onerror = () => reject();
          photoImg.src = emp.photo_url!;
        });
      } catch {
        // Fallback initials
        ctx.fillStyle = '#13241f';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.fillStyle = '#a3e635';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(emp.name.slice(0, 2).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 12);
      }
    } else {
      ctx.fillStyle = '#13241f';
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(emp.name.slice(0, 2).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 12);
    }
    ctx.restore();

    // Border around avatar
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Worker Text Details
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px sans-serif';
    ctx.fillText(emp.name, 160, 210);

    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(emp.employee_id, 160, 240);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(emp.position || 'Construction Laborer', 160, 266);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Site: ${siteName}`, 36, 310);
    ctx.fillText(`Category: ${emp.category || 'Site-Based'} · QR Ver: ${emp.qr_version || 1}`, 36, 332);

    // QR Code Container Box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(150, 360, 350, 350);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.strokeRect(150, 360, 350, 350);

    // Draw high-resolution QR
    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 165, 375, 320, 320);
        resolve();
      };
      qrImg.src = qrDataUrl;
    });

    // Scanner Instruction Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOLD TO TURNSTILE SCANNER AT SITE GATE', 325, 750);

    // Subtext & Cryptographic Tag
    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.fillText(`PAYLOAD: ${emp.employee_id} (VER: ${emp.qr_version || 1})`, 325, 778);
    ctx.fillText('DOLE 5-STAR SAFETY VERIFIED · ANTI-DUPLICATE PROTECTED', 325, 798);

    // Bottom Footer
    ctx.fillStyle = '#0e1a16';
    ctx.fillRect(15, 830, 620, 75);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('DE RUEDA CONSTRUCTION PHILIPPINES · CORPORATE ERP SYSTEM', 325, 872);

    return canvas.toDataURL('image/png');
  };

  // Download single image
  const handleDownloadSingleImage = async () => {
    setIsExporting(true);
    try {
      const pngUrl = await renderBadgeToCanvas(selectedEmp);
      const link = document.createElement('a');
      link.download = `DRC-QR-${selectedEmp.employee_id}-${selectedEmp.name.replace(/\s+/g, '_')}.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessToast(`Exported QR badge image file for ${selectedEmp.name} (${selectedEmp.employee_id})`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Failed to export QR image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Download raw QR code only (for PVC badge printers)
  const handleDownloadRawQrOnly = async () => {
    try {
      const qrDataUrl = await generateQrDataUrl(qrPayload, 600);
      const link = document.createElement('a');
      link.download = `DRC-RAW-QR-${selectedEmp.employee_id}.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessToast(`Downloaded raw QR image file for ${selectedEmp.employee_id}`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Failed to download raw QR:', err);
    }
  };

  // Physical card print layout
  const handlePrintPhysicalCard = () => {
    const printWindow = window.open('', '_blank', 'width=580,height=820');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DRC QR Badge - ${selectedEmp.employee_id}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #fff;
              color: #000;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
            }
            .card {
              width: 330px;
              border: 3px solid #080f0d;
              border-radius: 14px;
              padding: 20px;
              text-align: center;
              box-shadow: 0 4px 16px rgba(0,0,0,0.12);
              page-break-inside: avoid;
            }
            .header-badge {
              background: #0e1a16;
              color: #fff;
              padding: 10px;
              border-radius: 8px;
              margin-bottom: 14px;
            }
            .company { font-size: 15px; font-weight: 900; letter-spacing: 0.5px; }
            .subtitle { font-size: 9px; color: #a3e635; font-weight: 800; text-transform: uppercase; margin-top: 2px; }
            .worker-name { font-size: 18px; font-weight: 900; margin: 12px 0 2px; color: #080f0d; }
            .worker-id { font-family: monospace; font-size: 14px; font-weight: 800; color: #059669; }
            .worker-role { font-size: 12px; color: #475569; font-weight: 600; margin-top: 2px; }
            .worker-site { font-size: 11px; color: #64748b; margin-top: 2px; }
            .qr-wrapper {
              display: inline-block;
              padding: 10px;
              border: 2px solid #059669;
              border-radius: 10px;
              margin: 14px 0 8px;
              background: #fff;
            }
            .instructions { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155; }
            .footer-strip {
              margin-top: 14px;
              padding-top: 10px;
              border-top: 1px dashed #cbd5e1;
              font-size: 9px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header-badge">
              <div class="company">DE RUEDA CONSTRUCTION</div>
              <div class="subtitle">Turnstile Attendance Pass</div>
            </div>
            <div class="worker-name">${selectedEmp.name}</div>
            <div class="worker-id">${selectedEmp.employee_id}</div>
            <div class="worker-role">${selectedEmp.position}</div>
            <div class="worker-site">${selectedSite ? selectedSite.name : selectedEmp.site_id} &bull; ${selectedEmp.category || 'Site-Based'}</div>
            <div class="qr-wrapper">
              ${qrSvg}
            </div>
            <div class="instructions">Present to site turnstile gate upon Entry / Exit</div>
            <div class="footer-strip">
              DOLE 5-Star Occupational Safety &bull; QR Ver ${selectedEmp.qr_version || 1}
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Batch Export: prints or downloads multi-card batch for the filtered site workers
  const handleBatchPrintAll = () => {
    setIsBatchExporting(true);
    const targetList = filteredEmployees.slice(0, 30);
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      setIsBatchExporting(false);
      return;
    }

    const cardsHtml = targetList.map((emp) => {
      const p = JSON.stringify({ employee_id: emp.employee_id, qr_version: emp.qr_version || 1 });
      const svg = generateSvgQRCode(p, 160);
      const site = sites.find((s) => s.site_id === emp.site_id);
      return `
        <div class="card">
          <div class="header-badge">
            <div class="company">DE RUEDA CONSTRUCTION</div>
            <div class="subtitle">Turnstile Attendance Pass</div>
          </div>
          <div class="worker-name">${emp.name}</div>
          <div class="worker-id">${emp.employee_id}</div>
          <div class="worker-role">${emp.position}</div>
          <div class="worker-site">${site ? site.code : emp.site_id} &bull; ${emp.category || 'Site'}</div>
          <div class="qr-wrapper">
            ${svg}
          </div>
          <div class="instructions">Site Gate Biometric Pass</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DRC Worker Badges Batch (${targetList.length} Workers)</title>
          <style>
            @page { size: A4; margin: 8mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #fff;
              color: #000;
              margin: 0;
              padding: 10px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .card {
              border: 2px solid #080f0d;
              border-radius: 10px;
              padding: 14px;
              text-align: center;
              page-break-inside: avoid;
            }
            .header-badge {
              background: #0e1a16;
              color: #fff;
              padding: 8px;
              border-radius: 6px;
              margin-bottom: 8px;
            }
            .company { font-size: 13px; font-weight: 900; }
            .subtitle { font-size: 8px; color: #a3e635; font-weight: bold; text-transform: uppercase; }
            .worker-name { font-size: 15px; font-weight: 900; margin: 6px 0 2px; }
            .worker-id { font-family: monospace; font-size: 12px; font-weight: bold; color: #059669; }
            .worker-role { font-size: 11px; color: #475569; }
            .worker-site { font-size: 10px; color: #64748b; }
            .qr-wrapper {
              display: inline-block;
              padding: 6px;
              border: 1px solid #059669;
              border-radius: 6px;
              margin: 8px 0 4px;
            }
            .instructions { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #334155; }
          </style>
        </head>
        <body>
          <div class="grid">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsBatchExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0b1612] border border-[#234338] rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#13241f] border-b border-[#234338] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">Export Worker QR Badges</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
                  IMAGE EXPORT &amp; PRINT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate high-resolution image files (.png) and physical lamination passes for turnstile distribution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Worker Selector & Search */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Select Worker</span>
                <span className="text-[11px] text-slate-400">{filteredEmployees.length} Available</span>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, ID, position..."
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>

                <select
                  value={siteFilter}
                  onChange={(e) => setSiteFilter(e.target.value)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#a3e635]"
                >
                  <option value="ALL">All Project Sites</option>
                  {sites.map((s) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable Worker List */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 border border-[#234338] rounded-xl p-2 bg-[#080f0d]">
              {filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No workers match current filter criteria.
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isCurrent = emp.employee_id === selectedId;
                  return (
                    <button
                      key={emp.employee_id}
                      onClick={() => setSelectedId(emp.employee_id)}
                      className={`w-full p-2.5 rounded-lg text-left transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-[#10b981]/20 border border-[#a3e635] text-white shadow-sm'
                          : 'bg-[#13241f]/70 border border-transparent hover:border-[#234338] text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {emp.photo_url ? (
                          <img
                            src={emp.photo_url}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#234338] shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#080f0d] border border-[#234338] flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                            {emp.name.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{emp.position}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-mono text-[#a3e635] font-bold">
                          {emp.employee_id}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {emp.category || 'Site'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Batch Action */}
            <div className="pt-2 border-t border-[#234338]">
              <button
                onClick={handleBatchPrintAll}
                disabled={isBatchExporting || filteredEmployees.length === 0}
                className="w-full py-2 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#a3e635]" />
                <span>Print Multi-Badge Sheet ({filteredEmployees.length} Workers)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Badge Preview & Image Exporter */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {/* Live Badge Card Preview */}
            <div className="bg-[#080f0d] border-2 border-[#234338] rounded-xl p-5 shadow-2xl relative overflow-hidden">
              {/* Card Header Strip */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#234338]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#a3e635] flex items-center justify-center text-[#080f0d]">
                    <HardHat className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white tracking-wide">DE RUEDA CONSTRUCTION</div>
                    <div className="text-[9px] font-mono text-[#a3e635] font-bold">SITE ACCESS CREDENTIAL</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  <span>DOLE 5-STAR</span>
                </div>
              </div>

              {/* Worker Profile Header */}
              <div className="flex items-center gap-3.5">
                {selectedEmp.photo_url ? (
                  <img
                    src={selectedEmp.photo_url}
                    alt={selectedEmp.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#a3e635] shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#13241f] border-2 border-[#a3e635] flex items-center justify-center font-extrabold text-[#a3e635] text-base shrink-0">
                    {selectedEmp.name.slice(0, 2)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-base font-black text-white leading-tight truncate">
                    {selectedEmp.name}
                  </div>
                  <div className="text-xs font-mono font-bold text-[#a3e635]">
                    {selectedEmp.employee_id}
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {selectedEmp.position} &bull; <span className="text-slate-400">{selectedSite ? selectedSite.name : selectedEmp.site_id}</span>
                  </div>
                </div>
              </div>

              {/* Central Scannable QR Code */}
              <div className="mt-4 p-3 bg-white rounded-xl flex flex-col items-center justify-center shadow-lg border-2 border-[#10b981]">
                <div
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  className="w-[180px] h-[180px] flex items-center justify-center"
                />
                <span className="text-[10px] font-mono text-slate-800 font-bold tracking-wider mt-1">
                  OFFICIAL TURNSTILE SCANNABLE QR
                </span>
              </div>

              {/* Instructions & Cryptographic Verification Tag */}
              <div className="mt-3 text-center space-y-1">
                <div className="text-xs font-extrabold text-white">
                  HOLD TO TURNSTILE SCANNER AT SITE GATE
                </div>
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-2">
                  <span>Version: {selectedEmp.qr_version || 1}</span>
                  <span>&bull;</span>
                  <span>Anti-Duplicate Protected</span>
                </div>
              </div>

              {/* Payload String Quick Copy */}
              <div className="mt-3 pt-2.5 border-t border-[#13241f] flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate">Payload: <code className="text-[#a3e635] font-mono">{qrPayload}</code></span>
                <button
                  onClick={handleCopyPayload}
                  className="text-slate-400 hover:text-white flex items-center gap-1 font-mono shrink-0 ml-2"
                  title="Copy QR payload"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Export Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#234338]">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleDownloadSingleImage}
                  disabled={isExporting}
                  className="py-2.5 px-3 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  <span>{isExporting ? 'Generating PNG...' : 'Export Image File (PNG)'}</span>
                </button>

                <button
                  onClick={handlePrintPhysicalCard}
                  className="py-2.5 px-3 bg-[#13241f] border border-[#234338] text-white hover:border-[#10b981] hover:text-[#a3e635] font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Physical Card</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Direct high-resolution output ready for worker badge lamination</span>
                <button
                  onClick={handleDownloadRawQrOnly}
                  className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Raw QR Code Only</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
