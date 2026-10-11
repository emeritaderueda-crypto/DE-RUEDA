export async function onRequestGet(): Promise<Response> {
  return new Response(
    JSON.stringify({
      merchant_id: 'DRC-GCASH-ENT-2026',
      account_name: 'DE RUEDA CONSTRUCTION INC. (CORP DISBURSEMENT)',
      available_balance: 528450.0,
      daily_disbursement_limit: 1000000.0,
      daily_disbursed_today: 47850.0,
      status: 'ACTIVE',
      settlement_currency: 'PHP',
      last_topup_date: '2026-10-09 09:30 AM',
      network_provider: 'Globe Telecom / Mynt (G-Xchange, Inc.)',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}
