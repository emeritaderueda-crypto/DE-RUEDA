export async function onRequestGet(): Promise<Response> {
  return new Response(
    JSON.stringify({
      merchant_id: 'DRC-GCASH-ENT-2026',
      account_name: 'DE RUEDA CONSTRUCTION INC. (CORP DISBURSEMENT - SANDBOX)',
      available_balance: 528450.0,
      daily_disbursement_limit: 1000000.0,
      daily_disbursed_today: 47850.0,
      status: 'ACTIVE',
      settlement_currency: 'PHP',
      last_topup_date: '2026-10-09 09:30 AM',
      network_provider: 'Globe Telecom / Mynt (Sandbox Simulation)',
      is_sandbox_simulation: true,
      api_mode: 'SANDBOX_SIMULATION',
      note: 'Simulated corporate disbursement wallet for internal ERP testing. Production bank settlement requires authenticated PayMongo or GCash Business credentials.',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}
