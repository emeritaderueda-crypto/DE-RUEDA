import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  Server,
  Building2,
} from 'lucide-react';

interface PayMongoEnvConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const PayMongoEnvConfigDialog: React.FC<PayMongoEnvConfigDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [customerId, setCustomerId] = useState<string>('DERUEDA_PRIMARY');
  const [customerName, setCustomerName] = useState<string>('De Rueda Construction - Central Headquarters');
  const [environment, setEnvironment] = useState<'test' | 'live'>('test');
  const [secretKey, setSecretKey] = useState<string>('');
  const [publicKey, setPublicKey] = useState<string>('');
  const [webhookSecret, setWebhookSecret] = useState<string>('');

  // Visibility toggles
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/paymongo/webhook`
    : '/api/paymongo/webhook';

  // Load current server-side configuration status
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setSaveStatus(null);
    setTestResult(null);

    fetch(`/api/paymongo/config?customerId=${encodeURIComponent(customerId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setEnvironment(data.config.environment || 'test');
          setPublicKey(data.config.publicKeyMasked || '');
          setSecretKey(data.config.hasSecretKey ? '••••••••••••••••••••••••••••••••' : '');
          setWebhookSecret(data.config.hasWebhookSecret ? '••••••••••••••••••••••••••••••••' : '');
          if (data.config.customerName) setCustomerName(data.config.customerName);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/paymongo/validate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          environment,
          secretKey: secretKey.includes('•') ? undefined : secretKey,
          publicKey: publicKey.includes('•') ? undefined : publicKey,
          webhookSecret: webhookSecret.includes('•') ? undefined : webhookSecret,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Credentials verified successfully.' : 'Validation failed.'),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Network error connecting to validation endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/paymongo/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          customerName,
          environment,
          secretKey: secretKey.includes('•') ? undefined : secretKey,
          publicKey: publicKey.includes('•') ? undefined : publicKey,
          webhookSecret: webhookSecret.includes('•') ? undefined : webhookSecret,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus({
          success: true,
          message: 'PayMongo environment configuration saved securely to server.',
        });
        onSaved?.();
      } else {
        setSaveStatus({
          success: false,
          message: data.error || 'Failed to save PayMongo configuration.',
        });
      }
    } catch (err: any) {
      setSaveStatus({
        success: false,
        message: err?.message || 'Network error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const isConfigured = Boolean(secretKey && publicKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0a1128] border border-[#1e3a8a] rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1e3a8a]/40 bg-[#070d1f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>PayMongo Environment Configuration</span>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                  environment === 'live'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {environment.toUpperCase()} MODE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Specification Section 5: Customer-specific hosted invoice checkout credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#13241f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corporate Status Handoff Notice: ON HOLD */}
        <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Provider Status: ON HOLD (Maintenance Issue)</strong> — Live payments and disbursements are paused per corporate directive. Simulation mode is enabled for development, payroll review, and preparation.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 uppercase">
            On Hold
          </span>
        </div>

        {/* Current Status Strip */}
        <div className={`px-6 py-3 border-b text-xs flex items-center justify-between gap-3 ${
          isConfigured
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
            : 'bg-slate-900 border-slate-700 text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>
              {isConfigured
                ? `Checkout Status: Configured for ${environment === 'live' ? 'Live Production (Paused while on hold)' : 'Sandbox Simulation'}.`
                : 'Checkout Status: Keys On Hold. Enter provider credentials below once service is restored.'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Server Protected
          </span>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Customer Deployment Identifier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer / Deployment ID *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="e.g. DERUEDA_PRIMARY"
                  className="w-full pl-9 pr-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Each customer maintains independent credentials (no cross-tenant leakage).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organization / Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. De Rueda Construction - Central"
                className="w-full px-3 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Environment Selector: PAYMONGO_ENVIRONMENT */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              PAYMONGO_ENVIRONMENT *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEnvironment('test')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  environment === 'test'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-200 ring-1 ring-amber-400'
                    : 'bg-[#070d1f] border-[#1e3a8a]/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Test First (Sandbox)</div>
                  <div className="text-[10px] text-slate-400">Use test credentials to simulate invoices &amp; webhooks safely.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEnvironment('live')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  environment === 'live'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-400'
                    : 'bg-[#070d1f] border-[#1e3a8a]/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Live Production</div>
                  <div className="text-[10px] text-slate-400">Requires verified business credentials and customer sign-off.</div>
                </div>
              </button>
            </div>
          </div>

          {/* PAYMONGO_SECRET_KEY */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                PAYMONGO_SECRET_KEY *
              </label>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                Server-side only (never exposed in browser)
              </span>
            </div>
            <div className="relative">
              <input
                type={showSecretKey ? 'text' : 'password'}
                required
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={environment === 'live' ? 'sk_live_••••••••••••••••••••' : 'sk_test_••••••••••••••••••••'}
                className="w-full pl-3 pr-10 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Obtained from customer's PayMongo Developers dashboard &gt; API Keys.
            </p>
          </div>

          {/* PAYMONGO_PUBLIC_KEY */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                PAYMONGO_PUBLIC_KEY *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Client checkout reference
              </span>
            </div>
            <div className="relative">
              <input
                type={showPublicKey ? 'text' : 'password'}
                required
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder={environment === 'live' ? 'pk_live_••••••••••••••••••••' : 'pk_test_••••••••••••••••••••'}
                className="w-full pl-3 pr-10 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => setShowPublicKey(!showPublicKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPublicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* PAYMONGO_WEBHOOK_SECRET */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                PAYMONGO_WEBHOOK_SECRET *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Used to verify signed webhook events
              </span>
            </div>
            <div className="relative">
              <input
                type={showWebhookSecret ? 'text' : 'password'}
                required
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_••••••••••••••••••••"
                className="w-full pl-3 pr-10 py-2 bg-[#070d1f] border border-[#1e3a8a] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Webhook Endpoint Display */}
          <div className="p-3 bg-[#070d1f] border border-[#1e3a8a]/60 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>Your Server Webhook Endpoint</span>
              </span>
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1"
              >
                {copiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWebhook ? 'Copied' : 'Copy Endpoint URL'}</span>
              </button>
            </div>
            <div className="p-2 bg-[#030712] border border-[#1e3a8a]/40 rounded-lg text-[11px] font-mono text-slate-300 break-all select-all">
              {webhookUrl}
            </div>
            <p className="text-[10px] text-slate-400">
              Paste this URL in customer's PayMongo Webhook Settings for events: <code>source.chargeable</code>, <code>payment.paid</code>, <code>payment.failed</code>.
            </p>
          </div>

          {/* Feedback & Error States */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {saveStatus && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              saveStatus.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              {saveStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {/* Actions Strip */}
          <div className="pt-3 border-t border-[#1e3a8a]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              disabled={isTesting || !secretKey || !publicKey}
              onClick={handleTestConnection}
              className="w-full sm:w-auto px-4 py-2 bg-[#1e3a8a]/50 hover:bg-[#1e3a8a] text-sky-200 border border-[#38bdf8]/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Test Credentials</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Server...</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
