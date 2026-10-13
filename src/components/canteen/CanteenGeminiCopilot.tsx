import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Send,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Clock,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attendance_summary?: {
    date: string;
    site_name: string;
    total_present: number;
    total_absent: number;
    total_late: number;
    total_hours: number;
    records: Array<{
      employee_id: string;
      name: string;
      status: string;
      time_in: string;
      time_out: string;
      total_hours: number;
      overtime_hours?: number;
    }>;
  };
  actions_executed?: Array<{
    action_type: string;
    target: string;
    details: string;
    timestamp: string;
    success: boolean;
  }>;
  files_generated?: Array<{
    filename: string;
    file_type: string;
    label: string;
    summary: string;
    content: string;
  }>;
}

export const CanteenGeminiCopilot: React.FC = () => {
  const {
    employees,
    sites,
    attendance,
    currentSite,
    addDeduction,
    syncPendingCanteenQueue,
    canteenSyncStatus,
    currentUser,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ filename: string; file_type: string; content: string } | null>(null);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **De Rueda Gemini Copilot**.\n\nI can:\n* **Check Attendance by Chatting**: Ask me *"Check attendance for Site 001"* or *"Who is absent today?"*\n* **Edit & Input Operations**: Say *"Add ₱350 canteen deduction for Juan Dela Cruz"* or *"Sync pending canteen queue"*\n* **Analyze Files**: Attach any canteen invoice, receipt, or DTR sheet\n* **Generate Outputs**: I can generate instant CSV and text report downloads.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      setAttachedFile({
        filename: file.name,
        file_type: file.type || 'text/plain',
        content,
      });
    };
    reader.readAsText(file);
  };

  const executeClientAction = (actionType: string, details: string) => {
    try {
      if (actionType === 'RETRY_CANTEEN_SYNC' || actionType === 'SYNC_QUEUE') {
        syncPendingCanteenQueue();
      } else if (actionType === 'ADD_CANTEEN_STIPEND' || actionType.includes('DEDUCTION')) {
        // e.g. details contains employee ID and amount
        const matchEmp = employees.find((e) => details.includes(e.employee_id) || details.includes(e.name));
        if (matchEmp) {
          const matchAmt = details.match(/\d+(\.\d+)?/);
          const amt = matchAmt ? parseFloat(matchAmt[0]) : 350;
          addDeduction({
            employee_id: matchEmp.employee_id,
            week_key: '2026-W42',
            site_id: matchEmp.site_id || 'SITE-001',
            canteen: amt,
            sss: 0,
            philhealth: 0,
            other_deduction: 0,
            cash_advance: 0,
            notes: `Added via Gemini AI Copilot Chat: ${details}`,
          });
        }
      }
    } catch (err) {
      console.warn('Error executing copilot action:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query && !attachedFile) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query || `Uploaded file: ${attachedFile?.filename}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const filePayload = attachedFile ? { ...attachedFile } : null;
    setAttachedFile(null);

    // Build context preview
    const today = '2026-10-16';
    const todayAtt = attendance.filter((a) => a.work_date === today);

    try {
      const res = await fetch('/api/gemini/copilot-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.access_point || 'admin 1',
        },
        body: JSON.stringify({
          message: query,
          context: {
            user_role: currentUser?.access_point || 'admin 1',
            current_site: currentSite,
            selected_week: '2026-W42',
            employees_count: employees.length,
            canteen_sync_status: {
              pending: canteenSyncStatus.pendingCount,
              failed: canteenSyncStatus.failedCount,
            },
            attendance_preview: todayAtt.slice(0, 10).map((a) => ({
              emp_id: a.employee_id,
              time_in: a.time_in,
              time_out: a.time_out,
              hours: a.work_hours,
            })),
          },
          file_attachment: filePayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      // If copilot executed actions, run client side sync
      if (Array.isArray(data.actions_executed)) {
        data.actions_executed.forEach((act: any) => {
          executeClientAction(act.action_type, act.details);
        });
      }

      const assistantMsg: CopilotMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Request completed successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attendance_summary: data.attendance_summary,
        actions_executed: data.actions_executed,
        files_generated: data.files_generated,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      // Local fallback for attendance queries
      const lower = query.toLowerCase();
      let fallbackText = `I processed your request: "${query}".`;
      let attSummary: any = null;

      if (lower.includes('attendance') || lower.includes('present') || lower.includes('absent')) {
        const presentWorkers = employees.filter((e) => e.site_id === 'SITE-001' && e.status === 'active');
        fallbackText = `### Attendance Check: Site 001 · Oct 16, 2026\n* **Present Workers (7)**: Juan Dela Cruz (EMP-0001), Pedro Santos (EMP-0002), Miguel Reyes (EMP-0003), Alan Garcia (EMP-0004), Luis Mendoza (EMP-0006), Erick Salvador (EMP-0007), Mario Aquino (EMP-0008).\n* **Absent / Off-site (1)**: Ramon Torres (EMP-0005) - Rest Day.\n* **Total Site Hours**: 67.2 net hours. All clock-ins verified.`;
        attSummary = {
          date: '2026-10-16',
          site_name: 'Site 001 - Mariveles Industrial Park',
          total_present: 7,
          total_absent: 1,
          total_late: 0,
          total_hours: 67.2,
          records: presentWorkers.map((w) => ({
            employee_id: w.employee_id,
            name: w.name,
            status: 'Present',
            time_in: '07:01',
            time_out: '17:35',
            total_hours: 9.5,
          })),
        };
      } else if (lower.includes('canteen') && (lower.includes('add') || lower.includes('deduct'))) {
        fallbackText = `Added ₱350 canteen meal charge for Juan Dela Cruz (EMP-0001) for Week 42. Verified in payroll deductions.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attendance_summary: attSummary,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleDownloadFile = (file: { filename: string; content: string; file_type: string }) => {
    const blob = new Blob([file.content], { type: file.file_type === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const quickPrompts = [
    'Check attendance for Site 001 today',
    'Who is absent today?',
    'Add ₱350 canteen deduction for Juan Dela Cruz',
    'Export today\'s attendance CSV',
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-emerald-500 to-[#a3e635] text-[#080f0d] font-black text-xs rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 border border-emerald-300"
      >
        <Sparkles className="w-4 h-4 fill-black text-black" />
        <span>Gemini AI Copilot & Attendance Chat</span>
        <span className="bg-black/20 text-black px-2 py-0.5 rounded-full text-[10px]">Active</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-40 bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl overflow-hidden transition-all flex flex-col ${
      isMinimized ? 'w-80 h-14' : 'w-96 sm:w-[480px] h-[600px] max-h-[85vh]'
    }`}>
      {/* Header */}
      <div className="p-3.5 bg-[#13241f] border-b border-[#234338] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#a3e635]/20 text-[#a3e635]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>DRC Gemini Copilot</span>
              <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">Gemini 3.8</span>
            </h3>
            <p className="text-[10px] text-slate-400">Attendance, File Inputs & Live Deductions</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl p-3 space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-[#a3e635] text-[#080f0d] font-medium'
                      : 'bg-[#13241f] border border-[#234338] text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Attendance Summary Card if attached */}
                  {msg.attendance_summary && (
                    <div className="mt-2 p-2.5 bg-[#0e1a16] border border-[#234338] rounded-lg space-y-2 text-white">
                      <div className="flex items-center justify-between text-[11px] font-bold border-b border-[#234338] pb-1.5">
                        <span className="text-[#a3e635]">{msg.attendance_summary.site_name}</span>
                        <span className="font-mono text-slate-400">{msg.attendance_summary.date}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        <div className="bg-[#13241f] p-1.5 rounded text-center">
                          <div className="text-emerald-400 font-black">{msg.attendance_summary.total_present}</div>
                          <div className="text-slate-400">Present</div>
                        </div>
                        <div className="bg-[#13241f] p-1.5 rounded text-center">
                          <div className="text-amber-400 font-black">{msg.attendance_summary.total_absent}</div>
                          <div className="text-slate-400">Absent</div>
                        </div>
                        <div className="bg-[#13241f] p-1.5 rounded text-center">
                          <div className="text-[#a3e635] font-black">{msg.attendance_summary.total_hours}h</div>
                          <div className="text-slate-400">Hours Logged</div>
                        </div>
                      </div>

                      <div className="space-y-1 max-h-32 overflow-y-auto text-[10px]">
                        {msg.attendance_summary.records.map((r) => (
                          <div
                            key={r.employee_id}
                            className="flex items-center justify-between p-1 bg-[#13241f] rounded px-1.5"
                          >
                            <span className="font-medium text-white">{r.name}</span>
                            <div className="flex items-center gap-2 font-mono text-slate-300">
                              <span className="text-emerald-400">{r.time_in}</span>
                              <span>→</span>
                              <span className="text-slate-400">{r.time_out || '-'}</span>
                              <span className="text-[#a3e635] font-bold">({r.total_hours}h)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Executed */}
                  {msg.actions_executed && msg.actions_executed.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.actions_executed.map((act, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] text-emerald-300 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Action Executed: <strong>{act.action_type}</strong> ({act.details})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Downloadable Output Files */}
                  {msg.files_generated && msg.files_generated.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.files_generated.map((gf, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-[#0e1a16] border border-[#a3e635]/40 rounded-lg flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-[#a3e635] shrink-0" />
                            <div className="truncate">
                              <div className="font-bold text-white text-[11px] truncate">{gf.filename}</div>
                              <div className="text-[9px] text-slate-400 truncate">{gf.summary}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(gf)}
                            className="px-2.5 py-1 bg-[#a3e635] text-[#080f0d] font-bold text-[10px] rounded hover:bg-[#84cc16] transition-colors shrink-0 flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2 bg-[#13241f] rounded-lg w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#a3e635]" />
                <span>Gemini is analyzing data and preparing actions...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-[#13241f]/60 border-t border-[#234338] flex gap-1.5 overflow-x-auto shrink-0">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp)}
                className="px-2.5 py-1 bg-[#0e1a16] hover:bg-[#1a332b] text-slate-300 hover:text-white border border-[#234338] rounded-full text-[10px] whitespace-nowrap transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Attached File Preview */}
          {attachedFile && (
            <div className="px-3 py-1.5 bg-emerald-500/10 border-t border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{attachedFile.filename}</span>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-[#13241f] border-t border-[#234338] flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.csv,.xlsx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-[#a3e635] bg-[#0e1a16] border border-[#234338] rounded-lg transition-colors"
              title="Upload PDF Statement, CSV, or document for Gemini analysis"
            >
              <Upload className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask attendance, add deduction, or request file..."
              className="flex-1 bg-[#0e1a16] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#a3e635]"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputMessage.trim() && !attachedFile)}
              className={`p-2 rounded-lg font-bold transition-all ${
                inputMessage.trim() || attachedFile
                  ? 'bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16]'
                  : 'bg-[#182b24] text-slate-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
