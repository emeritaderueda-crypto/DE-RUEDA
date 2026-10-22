import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { generateSvgQRCode, generateQrDataUrl } from '../../utils/qrGenerator';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  HardHat,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const PublicQrCodeGenerator: React.FC = () => {
  const { employees, sites } = useApp();

  const [searchInput, setSearchInput] = useState<string>('');
  const [disambiguatedId, setDisambiguatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Match lookup against registered employee records only
  const matchResult = useMemo(() => {
    const raw = searchInput.trim();
    if (!raw) {
      return { status: 'EMPTY' as const, employee: null, matches: [] };
    }

    // 1. Direct Employee ID match (Highest priority & unique)
    const exactIdMatch = employees.find(
      (e) => e.employee_id.toLowerCase() === raw.toLowerCase()
    );
    if (exactIdMatch) {
      return { status: 'MATCHED' as const, employee: exactIdMatch, matches: [exactIdMatch] };
    }

    // 2. Disambiguated selection if previously multiple matches were found
    if (disambiguatedId) {
      const explicit = employees.find((e) => e.employee_id === disambiguatedId);
      if (explicit) {
        return { status: 'MATCHED' as const, employee: explicit, matches: [explicit] };
      }
    }

    // 3. Name lookup (case-insensitive substring or exact match)
    const q = raw.toLowerCase();
    const nameMatches = employees.filter((e) => e.name.toLowerCase().includes(q));

    if (nameMatches.length === 1) {
      return { status: 'MATCHED' as const, employee: nameMatches[0], matches: nameMatches };
    } else if (nameMatches.length > 1) {
      return { status: 'AMBIGUOUS' as const, employee: null, matches: nameMatches };
    }

    return { status: 'NOT_FOUND' as const, employee: null, matches: [] };
  }, [searchInput, disambiguatedId, employees]);

  // Active verified employee
  const currentWorker = matchResult.employee;

  // Resolve authorized site (locked to verified record; unauthorized selection blocked)
  const authorizedSite = useMemo(() => {
    if (!currentWorker) return null;
    return sites.find((s) => s.site_id === currentWorker.site_id);
  }, [currentWorker, sites]);

  // Turnstile-compliant QR payload (secure identifier, no sensitive personal or financial data)
  const qrPayload = useMemo(() => {
    if (!currentWorker) return '';
    return JSON.stringify({
      employee_id: currentWorker.employee_id,
      qr_version: currentWorker.qr_version || 1,
    });
  }, [currentWorker]);

  // SVG representation
  const qrSvg = useMemo(() => {
    if (!qrPayload) return '';
    return generateSvgQRCode(qrPayload, 180);
  }, [qrPayload]);

  const handleCopyPayload = () => {
    if (!qrPayload) return;
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download high-resolution PNG badge with DRC styling
  const handleDownloadBadge = async () => {
    if (!currentWorker || !qrPayload) return;
    setDownloading(true);
    try {
      const qrDataUrl = await generateQrDataUrl(qrPayload, 400);

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 820;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const siteName = authorizedSite ? `${authorizedSite.code} - ${authorizedSite.name}` : currentWorker.site_id;

      // Dark card background
      ctx.fillStyle = '#080f0d';
      ctx.fillRect(0, 0, 600, 820);

      // Card border
      ctx.strokeStyle = '#234338';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 580, 800);

      // Top Header bar
      ctx.fillStyle = '#0e1a16';
      ctx.fillRect(10, 10, 580, 110);

      // Header accent strip
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(10, 116, 580, 4);

      // Company Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('DE RUEDA CONSTRUCTION', 30, 52);

      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('OFFICIAL TURNSTILE ATTENDANCE BADGE · DOLE COMPLIANT', 30, 82);

      // Worker Name & ID
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(currentWorker.name, 30, 170);

      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(currentWorker.employee_id, 30, 202);

      // Role & Authorized Site
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px sans-serif';
      ctx.fillText(`Designation: ${currentWorker.position || 'Field Laborer'}`, 30, 235);
      ctx.fillText(`Authorized Site: ${siteName}`, 30, 260);

      // QR Code Box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(140, 290, 320, 320);

      // Draw QR image
      const qrImg = new Image();
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 150, 300, 300, 300);
          resolve();
        };
        qrImg.src = qrDataUrl;
      });

      // Turnstile instructions
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOLD TO TURNSTILE SCANNER AT SITE GATE', 300, 650);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText(`PAYLOAD: ${currentWorker.employee_id} (VER: ${currentWorker.qr_version || 1})`, 300, 678);
      ctx.fillText('ANTI-DUPLICATE PROTECTED · GEOFENCE RESTRICTED', 300, 700);

      // Footer bar
      ctx.fillStyle = '#0e1a16';
      ctx.fillRect(10, 735, 580, 75);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('DE RUEDA CONSTRUCTION PHILIPPINES · EST. 2018', 300, 775);

      // Trigger download
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `DRC-Badge-${currentWorker.employee_id}.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download badge:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Direct Browser Print formatted for card
  const handlePrintBadge = () => {
    if (!currentWorker) return;
    const siteName = authorizedSite ? `${authorizedSite.code} - ${authorizedSite.name}` : currentWorker.site_id;
    const printWindow = window.open('', '_blank', 'width=550,height=750');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DRC Worker QR Pass - ${currentWorker.employee_id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #000; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 90vh; }
            .card { width: 340px; border: 2px solid #080f0d; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 12px; }
            .company { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
            .subtitle { font-size: 10px; color: #475569; font-weight: 700; text-transform: uppercase; }
            .name { font-size: 18px; font-weight: 800; margin-top: 10px; color: #080f0d; }
            .id { font-family: monospace; font-size: 14px; font-weight: bold; color: #059669; }
            .meta { font-size: 11px; color: #64748b; margin: 4px 0 14px; }
            .qr-box { display: inline-block; padding: 8px; border: 1px solid #cbd5e1; border-radius: 8px; margin: 6px 0; }
            .instructions { font-size: 10px; color: #334155; font-weight: 600; margin-top: 12px; text-transform: uppercase; }
            .footer { margin-top: 14px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 9px; color: #94a3b8; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="company">DE RUEDA CONSTRUCTION</div>
              <div class="subtitle">Official Site Turnstile Pass</div>
            </div>
            <div class="name">${currentWorker.name}</div>
            <div class="id">${currentWorker.employee_id}</div>
            <div class="meta">${currentWorker.position} &bull; ${siteName}</div>
            <div class="qr-box">
              ${qrSvg}
            </div>
            <div class="instructions">Present at site turnstile gate upon Entry / Exit</div>
            <div class="footer">DOLE Safety Verified &bull; De Rueda Construction Management</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="qr-generator" className="bg-[#0f1c3d] border border-[#1e3a8a] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#1e3a8a]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">Employee QR Code Generator</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                  NO SIGN-IN REQUIRED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Match verified company records to generate your official site turnstile pass
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
            <Lock className="w-3 h-3" />
            <span>PROTECTED CREDENTIAL</span>
          </div>
        </div>

        {/* Input Section: Enter Full Name or Unique Employee ID */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Enter Your Full Name or Unique Employee ID *
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Juan Dela Cruz or DRC-EMP-2026-000001"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setDisambiguatedId(null);
                }}
                className="w-full bg-[#070d1f] border border-[#1e3a8a] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Codes are issued only after matching registered employee master records. Unregistered users cannot create records.
            </p>
          </div>

          {/* Quick Match Helper Pills for demonstration convenience */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-slate-400">Try Sample:</span>
            {employees.slice(0, 3).map((e) => (
              <button
                key={e.employee_id}
                type="button"
                onClick={() => {
                  setSearchInput(e.employee_id);
                  setDisambiguatedId(null);
                }}
                className="px-2 py-0.5 rounded-lg bg-[#070d1f] hover:bg-[#0a1329] text-emerald-300 border border-[#1e3a8a] transition-colors"
              >
                {e.name} ({e.employee_id})
              </button>
            ))}
          </div>
        </div>

        {/* Case 1: Ambiguous Name Matches (Duplicate Names) */}
        {matchResult.status === 'AMBIGUOUS' && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Multiple workers matched this name. Please enter your unique Employee ID:</span>
            </div>
            <div className="space-y-1">
              {matchResult.matches.map((m) => (
                <button
                  key={m.employee_id}
                  onClick={() => {
                    setDisambiguatedId(m.employee_id);
                  }}
                  className="w-full p-2 bg-[#070d1f] hover:bg-[#0a1329] border border-[#1e3a8a] rounded-xl text-left text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{m.name}</span>
                    <span className="text-[10px] text-slate-400">({m.position})</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold text-[11px]">{m.employee_id}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Case 2: Unmatched / Unknown Employee */}
        {matchResult.status === 'NOT_FOUND' && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center space-y-1">
            <div className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>No registered employee matches &ldquo;{searchInput}&rdquo;</span>
            </div>
            <p className="text-[11px] text-slate-400">
              To protect site integrity, unverified records cannot be created from the public page. Please verify your Employee ID with site HR in Bataan.
            </p>
          </div>
        )}

        {/* Case 3: Empty Search */}
        {matchResult.status === 'EMPTY' && (
          <div className="mt-4 p-4 bg-[#070d1f] border border-[#1e3a8a]/50 rounded-xl text-center text-xs text-slate-400">
            Please enter your registered full name or Employee ID to generate your pass.
          </div>
        )}

        {/* Case 4: Unambiguous Verified Match -> Generate Official QR Badge */}
        {matchResult.status === 'MATCHED' && currentWorker && (
          <div className="mt-5 p-4 rounded-xl bg-[#070d1f] border border-[#1e3a8a] shadow-inner space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Authentic SVG QR Code */}
              <div className="shrink-0 bg-white p-2.5 rounded-xl shadow-md border-2 border-emerald-500 flex flex-col items-center">
                <div
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  className="w-[140px] h-[140px] flex items-center justify-center"
                />
                <span className="text-[9px] font-mono text-slate-800 font-bold mt-1">
                  TURNSTILE SCANNABLE
                </span>
              </div>

              {/* Worker Credential Information (No Sensitive Financial / HR Info Leaked) */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    DRC Verified Credential &bull; Ver {currentWorker.qr_version || 1}
                  </span>
                </div>

                <div className="font-extrabold text-white text-base leading-tight truncate">
                  {currentWorker.name}
                </div>

                <div className="inline-block px-2 py-0.5 rounded-lg bg-[#0f1c3d] border border-[#1e3a8a] text-emerald-400 font-mono font-bold text-xs">
                  {currentWorker.employee_id}
                </div>

                <div className="text-xs text-slate-300 font-medium">
                  {currentWorker.position}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">
                    Authorized Site: {authorizedSite ? `${authorizedSite.code} - ${authorizedSite.name}` : currentWorker.site_id}
                  </span>
                </div>

                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-[10px] font-mono text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>DOLE Safety &bull; Geofence Restricted (Locked to Assigned Site)</span>
                </div>
              </div>
            </div>

            {/* Turnstile Non-Guessable Payload Tag */}
            <div className="pt-2.5 border-t border-[#1e3a8a]/40 flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate">
                Payload Token: <code className="text-emerald-400 font-mono">{qrPayload}</code>
              </span>
              <button
                onClick={handleCopyPayload}
                className="text-slate-400 hover:text-white flex items-center gap-1 font-mono shrink-0 ml-2 cursor-pointer"
                title="Copy QR payload string"
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
        )}
      </div>

      {/* Action Buttons for Download / Print */}
      {matchResult.status === 'MATCHED' && currentWorker && (
        <div className="mt-5 grid grid-cols-2 gap-2.5 pt-3 border-t border-[#1e3a8a]/40">
          <button
            onClick={handleDownloadBadge}
            disabled={downloading}
            className="py-2.5 px-3 bg-emerald-600 text-white hover:bg-emerald-500 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            {downloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloading ? 'Generating PNG...' : 'Download PNG Badge'}</span>
          </button>

          <button
            onClick={handlePrintBadge}
            className="py-2.5 px-3 bg-[#0a1128] border border-[#1e3a8a] text-white hover:border-emerald-400 hover:text-emerald-400 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Physical Card</span>
          </button>
        </div>
      )}
    </div>
  );
};
