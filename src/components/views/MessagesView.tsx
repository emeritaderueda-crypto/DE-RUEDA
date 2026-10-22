import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Send,
  Paperclip,
  Plus,
  Search,
  Users,
  ShieldCheck,
  Check,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  ChevronLeft,
  Info,
  Clock,
  HardHat,
  Building,
  RefreshCw,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';

interface AttachmentFile {
  name: string;
  size: number;
  type: string;
  progress: number;
  error?: string;
}

export const MessagesView: React.FC = () => {
  const { conversations, messages, currentUser, sendMessage, createConversation, sites } = useApp();

  const [activeConvId, setActiveConvId] = useState(conversations[0]?.conversation_id || 'CONV-001');
  const [inputText, setInputText] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'direct' | 'group'>('group');
  const [newSiteScope, setNewSiteScope] = useState<string>('ALL');

  // Mobile navigation state: 'list' or 'chat'
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  // Right details drawer on mobile
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

  // Attachment state with validation
  const [attachment, setAttachment] = useState<AttachmentFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.conversation_id === activeConvId) || conversations[0];
  const activeMessages = messages.filter((m) => m.conversation_id === activeConvId);

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchConv.toLowerCase())
  );

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeConvId]);

  // Handle select conversation on mobile
  const handleSelectConv = (convId: string) => {
    setActiveConvId(convId);
    setMobileView('chat');
  };

  const handleSend = () => {
    if (!inputText.trim() && !attachment) return;
    if (attachment && attachment.error) return;

    sendMessage(
      activeConvId,
      inputText.trim() || `[Attachment: ${attachment?.name}]`,
      attachment ? `${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)` : undefined
    );
    setInputText('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB limit
    if (file.size > MAX_SIZE) {
      setAttachment({
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        error: 'File exceeds 15MB limit. Please compress or select a smaller blueprint/PDF.',
      });
      return;
    }

    setAttachment({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      progress: 40,
    });

    // Simulate rapid upload progress
    setTimeout(() => {
      setAttachment((prev) => (prev ? { ...prev, progress: 100 } : null));
    }, 400);
  };

  const handleCreateConv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = createConversation(newTitle.trim(), newType);
    setActiveConvId(created.conversation_id);
    setIsNewConvOpen(false);
    setNewTitle('');
    setMobileView('chat');
  };

  // Channel Participants for right column
  const channelParticipants = [
    {
      name: 'Emerita De Rueda',
      role: 'Chief Executive Officer',
      status: 'Active',
      site: 'Executive Vault',
      badgeColor: 'border-amber-400/40 text-amber-300 bg-amber-950/30',
    },
    {
      name: 'Engr. Roberto Dela Cruz',
      role: 'Lead Project Engineer',
      status: 'On Site',
      site: 'Site 001 - Skyline',
      badgeColor: 'border-lime-400/40 text-lime-300 bg-lime-950/30',
    },
    {
      name: 'Carlos Mendoza',
      role: 'Safety & DOLE Compliance Officer',
      status: 'Active',
      site: 'Site 002 - Orion',
      badgeColor: 'border-sky-400/40 text-sky-300 bg-sky-950/30',
    },
    {
      name: 'Ana Maria Santos',
      role: 'HR & Payroll Administrator',
      status: 'Headquarters',
      site: 'Central Admin',
      badgeColor: 'border-emerald-400/40 text-emerald-300 bg-emerald-950/30',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              De Rueda Messages
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#13241f] text-[#a3e635] border border-[#234338]">
              Operational Hub
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#a3e635]" />
              Verified Enterprise Channel
            </span>
            <span>&bull;</span>
            <span>Site Supervisors, Engineers & Executive Leadership</span>
          </div>
        </div>

        <button
          onClick={() => setIsNewConvOpen(true)}
          className="px-3 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Channel
        </button>
      </div>

      {/* 3-Column Desktop / 2-Step Mobile Workspace */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden h-[660px] flex shadow-2xl relative">
        {/* COLUMN 1: Conversations List */}
        <div
          className={`w-full lg:w-72 border-r border-[#234338] flex flex-col bg-[#0b1411] shrink-0 ${
            mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Bar */}
          <div className="p-3 border-b border-[#234338] bg-[#0e1a16]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchConv}
                onChange={(e) => setSearchConv(e.target.value)}
                placeholder="Search channels..."
                className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#a3e635] transition-colors"
              />
            </div>
          </div>

          {/* Conversations Scroll list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#234338]/40">
            {filteredConvs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching channels found.
              </div>
            ) : (
              filteredConvs.map((c) => {
                const isSelected = c.conversation_id === activeConvId;
                const convMsgs = messages.filter((m) => m.conversation_id === c.conversation_id);
                const lastMsg = convMsgs.slice(-1)[0];

                return (
                  <button
                    key={c.conversation_id}
                    onClick={() => handleSelectConv(c.conversation_id)}
                    className={`w-full text-left p-3.5 transition-colors relative ${
                      isSelected
                        ? 'bg-[#13241f] border-l-4 border-[#a3e635]'
                        : 'hover:bg-[#13241f]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {c.type === 'group' ? (
                          <Users className="w-3.5 h-3.5 text-[#a3e635] shrink-0" />
                        ) : (
                          <HardHat className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        )}
                        <span className="font-bold text-xs text-white truncate max-w-[170px]">
                          {c.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {lastMsg ? lastMsg.created_at?.substring(11, 16) : ''}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate mt-1 pl-5">
                      {lastMsg ? (
                        <span>
                          <strong className="text-slate-300">{lastMsg.sender_name.split(' ')[0]}:</strong>{' '}
                          {lastMsg.text}
                        </span>
                      ) : (
                        <span className="italic text-slate-500">No messages yet</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Compliance Badge */}
          <div className="p-2.5 bg-[#0e1a16] border-t border-[#234338] text-[10px] text-slate-500 flex items-center justify-between">
            <span>Corporate Audit Trail</span>
            <span className="text-[#a3e635] font-mono">ISO 9001 / DOLE</span>
          </div>
        </div>

        {/* COLUMN 2: Active Chat Stream */}
        <div
          className={`flex-1 flex flex-col bg-[#080f0d] min-w-0 ${
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Chat Header */}
          <div className="p-3 bg-[#0e1a16] border-b border-[#234338] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile Back Button */}
              <button
                onClick={() => setMobileView('list')}
                className="lg:hidden p-1.5 text-slate-300 hover:text-white hover:bg-[#13241f] rounded-lg mr-1"
                aria-label="Back to channels"
              >
                <ChevronLeft className="w-5 h-5 text-[#a3e635]" />
              </button>

              <div className="w-8 h-8 rounded-lg bg-[#13241f] border border-[#234338] flex items-center justify-center text-[#a3e635] shrink-0">
                {activeConv?.type === 'group' ? <Users className="w-4 h-4" /> : <HardHat className="w-4 h-4" />}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span>{activeConv?.title}</span>
                  {activeConv?.pinned && <span className="text-[10px]">📌</span>}
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Active Channel &bull; Monitored for Project Compliance</span>
                </div>
              </div>
            </div>

            {/* Mobile info button to open details drawer */}
            <button
              onClick={() => setIsMobileDetailsOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-[#13241f] rounded-lg"
              aria-label="Channel Details"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Enterprise Access Notice */}
            <div className="bg-[#13241f]/70 border border-[#234338] rounded-lg p-2.5 text-center text-[11px] text-slate-300 max-w-lg mx-auto">
              <span className="text-[#a3e635] font-semibold">Enterprise Audit Notice:</span> All messages and attached files in this channel are recorded in the De Rueda Compliance Audit Ledger in accordance with DOLE site-safety directives.
            </div>

            {activeMessages.length === 0 ? (
              <div className="text-center py-20 text-xs text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>No messages yet in this channel.</p>
                <p className="text-[11px] text-slate-600 mt-1">Start communication with field engineers and site supervisors below.</p>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isMe = currentUser && (msg.sender_email === currentUser.email || msg.sender_name === currentUser.name);

                return (
                  <div
                    key={msg.message_id}
                    className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                      isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1.5">
                      <strong className={isMe ? 'text-[#a3e635]' : 'text-emerald-400'}>
                        {msg.sender_name}
                      </strong>
                      <span>&bull;</span>
                      <span>{msg.created_at?.substring(11, 16) || 'Just now'}</span>
                    </div>

                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed shadow-sm break-words ${
                        isMe
                          ? 'bg-[#10b981] text-[#080f0d] font-medium rounded-tr-xs'
                          : 'bg-[#13241f] border border-[#234338] text-white rounded-tl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {msg.attachments && msg.attachments !== '[]' && (
                        <div
                          className={`mt-2 pt-2 border-t flex items-center gap-2 text-[11px] font-mono ${
                            isMe ? 'border-black/20 text-[#080f0d]' : 'border-[#234338] text-[#a3e635]'
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{msg.attachments.replace(/^\[|\]$/g, '')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Card */}
          {attachment && (
            <div className="p-3 bg-[#111f1b] border-t border-[#234338] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {attachment.type.startsWith('image/') ? (
                  <ImageIcon className="w-5 h-5 text-[#a3e635] shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-sky-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                    {attachment.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {(attachment.size / 1024).toFixed(1)} KB &bull;{' '}
                    {attachment.error ? (
                      <span className="text-rose-400">{attachment.error}</span>
                    ) : attachment.progress < 100 ? (
                      <span className="text-amber-400">Uploading {attachment.progress}%</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 inline-flex">
                        <Check className="w-3 h-3" /> Ready to send
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAttachment(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 text-slate-400 hover:text-white rounded"
                aria-label="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Multiline Message Composer */}
          <div className="p-3 bg-[#0e1a16] border-t border-[#234338]">
            <div className="flex items-end gap-2">
              {/* Paperclip Button */}
              <label
                className="p-2.5 text-slate-400 hover:text-white hover:bg-[#13241f] rounded-lg cursor-pointer transition-colors shrink-0"
                title="Attach blueprint, document, or photo (up to 15MB)"
              >
                <Paperclip className="w-4 h-4 text-[#a3e635]" />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.txt"
                />
              </label>

              {/* Textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type message to team... (Press Enter to send, Shift + Enter for new line)"
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#a3e635] resize-none transition-colors"
                />
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={(!inputText.trim() && !attachment) || Boolean(attachment?.error)}
                className="p-2.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs rounded-lg transition-colors shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction Caption (PDF Section 3 Requirement) */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1">
              <span>Press <strong>Enter</strong> to send &bull; <strong>Shift + Enter</strong> for new line</span>
              <span className="hidden sm:inline text-slate-500">Max file upload: 15MB</span>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Channel Details & Participants (Desktop Column & Mobile Drawer) */}
        <div
          className={`w-72 border-l border-[#234338] bg-[#0b1411] flex flex-col shrink-0 ${
            isMobileDetailsOpen
              ? 'fixed inset-y-0 right-0 z-50 w-80 shadow-2xl bg-[#0b1411] flex'
              : 'hidden lg:flex'
          }`}
        >
          {/* Column Header */}
          <div className="p-3.5 bg-[#0e1a16] border-b border-[#234338] flex items-center justify-between">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#a3e635]" />
              Channel Details & Team
            </h2>
            {isMobileDetailsOpen && (
              <button
                onClick={() => setIsMobileDetailsOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Channel Info Card */}
            <div className="bg-[#13241f] border border-[#234338] rounded-lg p-3 text-xs space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Active Channel Info
              </div>
              <div className="font-bold text-white">{activeConv?.title}</div>
              <div className="text-[11px] text-slate-300">
                Type: {activeConv?.type === 'group' ? 'Multi-Site Group Channel' : 'Direct Channel'}
              </div>
              <div className="pt-2 border-t border-[#234338] text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#a3e635]" />
                <span>Audited Internal Compliance Channel</span>
              </div>
            </div>

            {/* Participants Roster */}
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                Active Participants ({channelParticipants.length})
              </div>

              <div className="space-y-2">
                {channelParticipants.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#0e1a16] border border-[#234338] text-xs flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                        <span className="truncate">{p.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{p.role}</div>
                      <div className="text-[9px] text-slate-500 truncate">{p.site}</div>
                    </div>

                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${p.badgeColor} shrink-0`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Verification Box */}
            <div className="p-3 rounded-lg bg-[#0e1a16] border border-[#234338] text-[11px] space-y-1.5">
              <div className="font-bold text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#a3e635]" />
                Verified Corporate Channel
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Communications adhere to DOLE and DPWH site governance protocols.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      {isNewConvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#a3e635]" />
                Create New De Rueda Message Channel
              </h2>
              <button
                onClick={() => setIsNewConvOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConv} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Channel Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#a3e635]"
                  placeholder="e.g. Site 002 Structural Steel Rigging"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Channel Scope
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#a3e635]"
                >
                  <option value="group">Multi-Site Group Channel</option>
                  <option value="direct">Direct 1-on-1 Channel</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Associated Project Site
                </label>
                <select
                  value={newSiteScope}
                  onChange={(e) => setNewSiteScope(e.target.value)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#a3e635]"
                >
                  <option value="ALL">All Project Sites</option>
                  {sites.map((s) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.name} ({s.site_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewConvOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16] transition-colors"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
