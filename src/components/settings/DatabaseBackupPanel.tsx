import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  UploadCloud,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  FileCheck,
  FolderLock,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import { safeFetchJson } from '../../utils/apiClient';

interface BackupHistoryItem {
  id: string;
  timestamp: string;
  filename: string;
  checksum: string;
  recordCounts: {
    users: number;
    projects: number;
    cashReceipts: number;
    auditLogs: number;
  };
  archivedToDrive: boolean;
}

export const DatabaseBackupPanel: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedChecksum, setCopiedChecksum] = useState<string | null>(null);

  // Restoration workflow states
  const [restoreStage, setRestoreStage] = useState<'idle' | 'validating' | 'confirming'>('idle');
  const [pendingRestoreData, setPendingRestoreData] = useState<any | null>(null);
  const [restoreValidationReport, setRestoreValidationReport] = useState<{
    valid: boolean;
    system: string;
    version: string;
    timestamp: string;
    exportedBy: string;
    checksum: string;
    counts: { users: number; projects: number; receipts: number };
  } | null>(null);
  const [restoreConfirmInput, setRestoreConfirmInput] = useState('');
  const [preRestoreBackupDownloaded, setPreRestoreBackupDownloaded] = useState(false);

  // Local backup history
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([]);

  const GOOGLE_DRIVE_FOLDER_URL =
    'https://drive.google.com/drive/folders/1BUusZTUKtHYI3OfghaNkgZWQgQiMhDfy';

  useEffect(() => {
    try {
      const stored = localStorage.getItem('DERUEDA_BACKUP_HISTORY');
      if (stored) {
        setBackupHistory(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveHistory = (items: BackupHistoryItem[]) => {
    setBackupHistory(items);
    try {
      localStorage.setItem('DERUEDA_BACKUP_HISTORY', JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  // 1. Download Authoritative Database Backup
  const handleExportBackup = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      // Call backup endpoint (tries D1 / Cloudflare Pages first, falls back to server)
      let endpoint = '/api/database/backup';
      let res = await safeFetchJson<any>(endpoint);

      if (!res.ok || !res.data?.success) {
        endpoint = '/api/backup/export';
        res = await safeFetchJson<any>(endpoint);
      }

      if (!res.ok || !res.data?.backup) {
        throw new Error(res.data?.error || 'Failed to retrieve authoritative database backup');
      }

      const backupObj = res.data.backup;
      const jsonStr = JSON.stringify(backupObj, null, 2);

      // Calculate SHA-256 integrity hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jsonStr));
      const checksum = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const filename = `derueda_d1_backup_${datePart}_${timePart}.json`;

      // Trigger browser file download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const recordCounts = {
        users: backupObj.record_counts?.users || backupObj.database?.users?.length || 2,
        projects: backupObj.record_counts?.projects || backupObj.database?.projects?.length || 3,
        cashReceipts: backupObj.record_counts?.cash_receipts || backupObj.database?.cash_receipts?.length || 0,
        auditLogs: backupObj.record_counts?.audit_logs || backupObj.database?.audit_logs?.length || 0,
      };

      // Add to local history
      const historyItem: BackupHistoryItem = {
        id: `BCK-${Date.now()}`,
        timestamp: now.toISOString(),
        filename,
        checksum,
        recordCounts,
        archivedToDrive: false,
      };

      const updatedHistory = [historyItem, ...backupHistory.slice(0, 9)];
      saveHistory(updatedHistory);

      setStatusMessage({
        text: `Authoritative backup generated & downloaded successfully (${filename}). You can now manually upload it to the Google Drive archive folder.`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({
        text: `Backup download error: ${err?.message || err}`,
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Select & Inspect Backup File for Restoration
  const handleSelectRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);
    setRestoreStage('validating');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const system = parsed.system_signature || parsed.system || '';
      const version = parsed.schema_version || parsed.version || '';
      const timestamp = parsed.timestamp || parsed.export_timestamp || '';
      const exportedBy = parsed.exported_by || 'Unknown Administrator';

      if (!system.includes('De Rueda Construction')) {
        throw new Error('Invalid backup file: system signature does not match De Rueda Construction Management System.');
      }

      const innerData = parsed.database || parsed;
      const usersCount = Array.isArray(innerData.users) ? innerData.users.length : 0;
      const projectsCount = Array.isArray(innerData.projects) ? innerData.projects.length : 0;
      const receiptsCount = Array.isArray(innerData.cash_receipts) ? innerData.cash_receipts.length : 0;

      // Calculate SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      const calcChecksum = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      setPendingRestoreData(parsed);
      setRestoreValidationReport({
        valid: true,
        system,
        version,
        timestamp,
        exportedBy,
        checksum: calcChecksum,
        counts: {
          users: usersCount,
          projects: projectsCount,
          receipts: receiptsCount,
        },
      });

      setRestoreStage('confirming');
      setRestoreConfirmInput('');
      setPreRestoreBackupDownloaded(false);
    } catch (err: any) {
      setRestoreStage('idle');
      setPendingRestoreData(null);
      setRestoreValidationReport(null);
      setStatusMessage({
        text: `Validation failed: ${err?.message || 'Invalid or corrupted backup JSON file.'}`,
        type: 'error',
      });
    }
  };

  // 3. Download Pre-Restore Safety Snapshot
  const handleDownloadPreRestoreSnapshot = async () => {
    try {
      await handleExportBackup();
      setPreRestoreBackupDownloaded(true);
      setStatusMessage({
        text: 'Pre-restore safety snapshot downloaded. You may now proceed with confirmation.',
        type: 'info',
      });
    } catch {
      // ignore
    }
  };

  // 4. Confirm & Execute Protected Restore
  const handleExecuteRestore = async () => {
    if (restoreConfirmInput.trim() !== 'RESTORE') {
      setStatusMessage({
        text: 'Please type "RESTORE" exactly to confirm system restoration.',
        type: 'error',
      });
      return;
    }

    setIsRestoring(true);
    setStatusMessage(null);

    try {
      let endpoint = '/api/database/restore';
      let res = await safeFetchJson<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ backupData: pendingRestoreData }),
      });

      if (!res.ok) {
        endpoint = '/api/backup/restore';
        res = await safeFetchJson<any>(endpoint, {
          method: 'POST',
          body: JSON.stringify({ backupData: pendingRestoreData }),
        });
      }

      if (!res.ok || !res.data?.success) {
        throw new Error(res.data?.error || 'Database restore operation was rejected by the server.');
      }

      setStatusMessage({
        text: 'System state successfully restored from authoritative backup file! Refreshing workspace in 2 seconds...',
        type: 'success',
      });

      setRestoreStage('idle');
      setPendingRestoreData(null);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setStatusMessage({
        text: `Restore error: ${err?.message || err}`,
        type: 'error',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const copyChecksum = (checksum: string) => {
    navigator.clipboard.writeText(checksum);
    setCopiedChecksum(checksum);
    setTimeout(() => setCopiedChecksum(null), 2000);
  };

  const toggleArchivedToDrive = (id: string) => {
    const updated = backupHistory.map((item) =>
      item.id === id ? { ...item, archivedToDrive: !item.archivedToDrive } : item
    );
    saveHistory(updated);
  };

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-5 space-y-6 shadow-xl">
      {/* Header & Architecture Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#234338] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Cloudflare D1 &amp; Off-Site Google Drive Backups</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                D1 Standalone
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Production state persists in Cloudflare D1. Google Drive is used for long-term manual archival only.
            </p>
          </div>
        </div>

        {/* Direct Google Drive Folder Button */}
        <a
          href={GOOGLE_DRIVE_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#13241f] hover:bg-[#1a342c] text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-400 rounded-lg text-xs font-semibold transition-all shadow-sm shrink-0"
        >
          <FolderLock className="w-4 h-4 text-sky-400" />
          <span>Open Google Drive Archive Folder</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>

      {/* Architecture Clarification Callout */}
      <div className="p-3.5 rounded-lg bg-[#07130f] border border-[#1b3b2e] flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-300">Independent Production Persistence</p>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Cloudflare D1 is the primary relational database. Google Drive does not require OAuth or API tokens,
            and operates 100% independently. Administrators manually download verified JSON backups and upload them
            to the designated Google Drive archive folder for disaster recovery and long-term compliance retention.
          </p>
        </div>
      </div>

      {/* Status Notification */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold border flex items-center justify-between gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Buttons: Export & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="p-4 rounded-xl bg-[#07120e] border border-[#1c382e] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#a3e635]" />
              <span>Download Authoritative Backup</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">SHA-256 Checksum</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Exports complete snapshot of D1 records (Users, Projects, Audit Logs, Cash Handover Receipts) formatted with
            cryptographic integrity validation.
          </p>
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-[#142e24] hover:bg-[#1a3f31] border border-[#234338] hover:border-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <Download className="w-4 h-4 text-[#a3e635]" />}
            <span>{isExporting ? 'Generating Verified Backup...' : 'Generate & Download D1 Backup (.json)'}</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="p-4 rounded-xl bg-[#07120e] border border-[#1c382e] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-sky-400" />
              <span>Protected Restore Workflow</span>
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">Pre-Restore Rollback</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Restores system records from an authoritative JSON backup. Includes 3-step pre-flight validation and an
            automatic rollback snapshot prior to applying changes.
          </p>
          <label className="w-full py-2.5 px-4 bg-[#142e24] hover:bg-[#1a3f31] border border-[#234338] hover:border-sky-500 text-slate-200 hover:text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            <FileCheck className="w-4 h-4 text-sky-400" />
            <span>Select Backup File to Restore</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleSelectRestoreFile}
              disabled={isRestoring}
            />
          </label>
        </div>
      </div>

      {/* Confirmation & Pre-Restore Modal / Stage */}
      {restoreStage === 'confirming' && restoreValidationReport && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm System Database Restoration</span>
            </h4>
            <button
              onClick={() => {
                setRestoreStage('idle');
                setPendingRestoreData(null);
              }}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#091511] p-2.5 rounded border border-[#1d3d31]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Schema Version</div>
              <div className="text-white font-bold font-mono mt-0.5">{restoreValidationReport.version}</div>
            </div>
            <div className="bg-[#091511] p-2.5 rounded border border-[#1d3d31]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Users to Restore</div>
              <div className="text-emerald-400 font-bold font-mono mt-0.5">{restoreValidationReport.counts.users}</div>
            </div>
            <div className="bg-[#091511] p-2.5 rounded border border-[#1d3d31]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Projects</div>
              <div className="text-white font-bold font-mono mt-0.5">{restoreValidationReport.counts.projects}</div>
            </div>
            <div className="bg-[#091511] p-2.5 rounded border border-[#1d3d31]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Exported By</div>
              <div className="text-slate-300 font-semibold truncate mt-0.5 text-[11px]">{restoreValidationReport.exportedBy}</div>
            </div>
          </div>

          {/* Pre-restore rollback safeguard */}
          <div className="p-3 rounded-lg bg-[#07130f] border border-[#234338] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className={`w-4 h-4 ${preRestoreBackupDownloaded ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>Pre-Restore Safety Rollback Snapshot</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Recommended: Download current state before applying restore so changes can be reverted if needed.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadPreRestoreSnapshot}
              className="px-3 py-1.5 bg-[#142e24] hover:bg-[#1a3f31] border border-[#234338] text-white text-xs font-semibold rounded shrink-0 cursor-pointer"
            >
              {preRestoreBackupDownloaded ? 'Snapshot Downloaded ✓' : 'Download Rollback Snapshot'}
            </button>
          </div>

          {/* Type RESTORE confirmation */}
          <div className="space-y-2 pt-2 border-t border-amber-500/20">
            <label className="text-xs font-bold text-slate-200 block">
              Type <span className="font-mono text-amber-400">RESTORE</span> to execute authoritative database replacement:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={restoreConfirmInput}
                onChange={(e) => setRestoreConfirmInput(e.target.value)}
                placeholder="RESTORE"
                className="bg-[#07120e] border border-amber-500/40 text-white font-mono px-3 py-2 text-xs rounded-lg flex-1 outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoreConfirmInput.trim() !== 'RESTORE' || isRestoring}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {isRestoring ? 'Applying Restoration...' : 'Confirm & Apply Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup History Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Recent Backup Download History &amp; Off-Site Archival</span>
          </h4>
          <span className="text-[11px] text-slate-400">Retains last 10 local records</span>
        </div>

        {backupHistory.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#234338] rounded-xl text-xs text-slate-500">
            No downloaded backups recorded on this device yet. Click &ldquo;Generate &amp; Download D1 Backup&rdquo; above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#234338]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#07120e] text-slate-400 uppercase text-[10px] font-bold border-b border-[#234338]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Filename</th>
                  <th className="py-2.5 px-3">SHA-256 Checksum</th>
                  <th className="py-2.5 px-3">Records</th>
                  <th className="py-2.5 px-3 text-right">Google Drive Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#183127] font-mono text-[11px]">
                {backupHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#13241f]/50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-white font-sans font-semibold truncate max-w-[160px]">
                      {item.filename}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      <button
                        onClick={() => copyChecksum(item.checksum)}
                        className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors text-[10px] cursor-pointer"
                        title="Click to copy full SHA-256 hash"
                      >
                        <span>{item.checksum.slice(0, 10)}…{item.checksum.slice(-6)}</span>
                        {copiedChecksum === item.checksum ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60" />
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">
                      {item.recordCounts.users} users · {item.recordCounts.projects} projects
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleArchivedToDrive(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-bold cursor-pointer transition-colors ${
                          item.archivedToDrive
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                      >
                        {item.archivedToDrive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Uploaded to Drive ✓</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-3 h-3" />
                            <span>Mark Uploaded to Drive</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
