function generateGCashReceiptSvg(params: {
  referenceNo: string;
  transactionId: string;
  recipientName: string;
  recipientMobile: string;
  amount: number;
  weekKey: string;
  siteId: string;
  siteName?: string;
  timestamp: string;
}): string {
  const formattedAmount = params.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const dateObj = new Date(params.timestamp);
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const cleanMobile = params.recipientMobile.replace(/\s+/g, '');
  const maskedMobile =
    cleanMobile.length >= 10
      ? `${cleanMobile.slice(0, 4)} ${cleanMobile.slice(4, 7)} ${cleanMobile.slice(7)}`
      : cleanMobile;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 820" width="540" height="820" style="background:#0b1612;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;">
  <defs>
    <linearGradient id="gcashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#005CE6"/>
      <stop offset="100%" stop-color="#003B99"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Container Box -->
  <rect x="20" y="20" width="500" height="780" rx="20" fill="#ffffff" filter="url(#shadow)"/>

  <!-- GCash Blue Header -->
  <path d="M 20 40 Q 20 20 40 20 L 500 20 Q 520 20 520 40 L 520 140 L 20 140 Z" fill="url(#gcashGrad)"/>

  <!-- GCash Logo Branding -->
  <text x="50" y="65" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="-0.5">GCash</text>
  <circle cx="152" cy="52" r="5" fill="#a3e635"/>
  <text x="50" y="92" font-size="12" font-weight="700" fill="#bae6fd" letter-spacing="1.5">SANDBOX DISBURSEMENT SIMULATION</text>
  <text x="50" y="112" font-size="11" font-weight="500" fill="#e0f2fe">De Rueda Construction Enterprise Portal (Simulation)</text>

  <!-- Verified Icon Badge -->
  <g transform="translate(430, 45)">
    <circle cx="28" cy="28" r="28" fill="#ffffff" opacity="0.2"/>
    <circle cx="28" cy="28" r="22" fill="#10b981"/>
    <path d="M 20 28 L 26 34 L 38 21" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Success Heading -->
  <text x="270" y="185" font-size="20" font-weight="800" fill="#0f172a" text-anchor="middle">Payment Voucher Created</text>
  <text x="270" y="208" font-size="12" font-weight="500" fill="#64748b" text-anchor="middle">${dateFormatted} · ${timeFormatted} (PHT)</text>

  <!-- Amount Highlight -->
  <rect x="50" y="225" width="440" height="90" rx="14" fill="#f0f7ff" stroke="#bfdbfe" stroke-width="1.5"/>
  <text x="270" y="258" font-size="13" font-weight="700" fill="#005ce6" text-anchor="middle" letter-spacing="0.5">SIMULATED SALARY DISBURSED</text>
  <text x="270" y="295" font-size="32" font-weight="900" fill="#003b99" text-anchor="middle" font-family="monospace">PHP ${formattedAmount}</text>

  <!-- Recipient Card -->
  <rect x="50" y="330" width="440" height="74" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <text x="70" y="356" font-size="11" font-weight="700" fill="#64748b">SENT TO EMPLOYEE</text>
  <text x="70" y="382" font-size="16" font-weight="800" fill="#0f172a">${params.recipientName.toUpperCase()}</text>
  <text x="470" y="382" font-size="14" font-weight="700" fill="#005ce6" text-anchor="end" font-family="monospace">${maskedMobile}</text>

  <!-- Breakdown Table -->
  <g transform="translate(50, 420)">
    <!-- Row 1 -->
    <text x="0" y="20" font-size="12" font-weight="600" fill="#64748b">Transaction Reference</text>
    <text x="440" y="20" font-size="12" font-weight="800" fill="#0f172a" text-anchor="end" font-family="monospace">${params.referenceNo}</text>
    <line x1="0" y1="35" x2="440" y2="35" stroke="#f1f5f9" stroke-width="1.5"/>

    <!-- Row 2 -->
    <text x="0" y="58" font-size="12" font-weight="600" fill="#64748b">GCash Gateway Txn ID</text>
    <text x="440" y="58" font-size="11" font-weight="700" fill="#475569" text-anchor="end" font-family="monospace">${params.transactionId}</text>
    <line x1="0" y1="73" x2="440" y2="73" stroke="#f1f5f9" stroke-width="1.5"/>

    <!-- Row 3 -->
    <text x="0" y="96" font-size="12" font-weight="600" fill="#64748b">Disbursed From</text>
    <text x="440" y="96" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end">DE RUEDA CONSTRUCTION INC.</text>
    <line x1="0" y1="111" x2="440" y2="111" stroke="#f1f5f9" stroke-width="1.5"/>

    <!-- Row 4 -->
    <text x="0" y="134" font-size="12" font-weight="600" fill="#64748b">Payroll Cycle &amp; Site</text>
    <text x="440" y="134" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end">${params.weekKey} · ${params.siteName || params.siteId}</text>
    <line x1="0" y1="149" x2="440" y2="149" stroke="#f1f5f9" stroke-width="1.5"/>

    <!-- Row 5 -->
    <text x="0" y="172" font-size="12" font-weight="600" fill="#64748b">Disbursement Fee</text>
    <text x="440" y="172" font-size="12" font-weight="800" fill="#10b981" text-anchor="end">PHP 0.00 (Enterprise Sandbox)</text>
    <line x1="0" y1="187" x2="440" y2="187" stroke="#f1f5f9" stroke-width="1.5"/>

    <!-- Row 6 -->
    <text x="0" y="210" font-size="12" font-weight="600" fill="#64748b">Payment Status</text>
    <text x="440" y="210" font-size="12" font-weight="800" fill="#0284c7" text-anchor="end">SIMULATION RECORDED (PENDING BANK SETTLEMENT)</text>
    <line x1="0" y1="225" x2="440" y2="225" stroke="#cbd5e1" stroke-width="1.5"/>
  </g>

  <!-- Security Verification Stamp -->
  <g transform="translate(50, 680)">
    <rect x="0" y="0" width="440" height="52" rx="10" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1"/>
    <text x="16" y="24" font-size="11" font-weight="700" fill="#0369a1">SIMULATED ELECTRONIC RECEIPT VOUCHER</text>
    <text x="16" y="40" font-size="9.5" font-weight="500" fill="#0284c7">Internal simulation voucher recorded in DRC Document Vault (04_Payroll_and_Disbursements)</text>
    <text x="424" y="32" font-size="10" font-weight="800" fill="#0284c7" text-anchor="end">DRC SANDBOX</text>
  </g>

  <!-- Bottom Disclaimers -->
  <text x="270" y="755" font-size="9" font-weight="500" fill="#94a3b8" text-anchor="middle">Powered by De Rueda ERP Sandbox Simulation Mode · Merchant ID: DRC-GCASH-ENT-2026</text>
  <text x="270" y="770" font-size="8.5" font-weight="400" fill="#cbd5e1" text-anchor="middle">Sandbox Simulation Mode · Non-Financial ERP Testing Voucher</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'items array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = items.map((item: any) => {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      const referenceNo = `GCASH-MP-${datePart}-${randomSuffix.slice(0, 7)}`;
      const transactionId = `TXN-DRC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const timestamp = now.toISOString();

      const cleanMobile = (item.gcash_number || '09180000000').toString().trim().replace(/[^0-9]/g, '');
      const receiptUrl = generateGCashReceiptSvg({
        referenceNo,
        transactionId,
        recipientName: item.employee_name,
        recipientMobile: cleanMobile,
        amount: parseFloat(item.amount) || 0,
        weekKey: item.week_key || '2026-W40',
        siteId: item.site_id || 'SITE-001',
        siteName: item.site_name,
        timestamp,
      });

      return {
        payroll_id: item.payroll_id,
        employee_id: item.employee_id,
        employee_name: item.employee_name,
        reference_no: referenceNo,
        transaction_id: transactionId,
        status: 'SIMULATION_PROCESSED',
        is_sandbox_simulation: true,
        amount: parseFloat(item.amount) || 0,
        receipt_url: receiptUrl,
        receipt_file_name: `GCash_Receipt_${item.employee_name.replace(/[^a-zA-Z0-9]/g, '_')}_${referenceNo}.svg`,
        timestamp,
      };
    });

    const totalDisbursed = results.reduce((sum: number, r: any) => sum + r.amount, 0);

    return new Response(
      JSON.stringify({
        success: true,
        batch_id: `BATCH-SIM-${Date.now()}`,
        count: results.length,
        total_amount: totalDisbursed,
        currency: 'PHP',
        is_sandbox_simulation: true,
        disclaimer: 'Batch vouchers generated in ERP sandbox simulation mode. Bank settlement requires authorized API keys or business file upload.',
        disbursements: results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Batch disbursement failed.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
