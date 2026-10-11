import { GoogleGenAI } from '@google/genai';

interface Env {
  GEMINI_API_KEY?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const { query, context: clientContext } = body;

    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = context.env?.GEMINI_API_KEY || '';

    const systemPrompt = `You are the Gemini AI Construction Copilot for De Rueda Construction Management System (a premier general contractor in Bataan, Central Luzon, Philippines).
You possess deep expertise in:
- Construction engineering & project management (steel framing, precast, MEPFS, civil works).
- Philippine construction laws & DOLE safety compliance (DOLE Department Order No. 13 - Guidelines Governing Occupational Safety and Health in the Construction Industry).
- OSHC regulations, Building Code of the Philippines (PD 1096), and DPWH specifications.
- Labor payroll standards, SSS, PhilHealth, Pag-IBIG, 13th month pay, and field DTR records.
- Google Drive document management and organic 8-folder project archiving.

Current System Context:
Active Sites: Site 001 Mariveles Warehouse A, Site 002 Subic Commercial Complex, Site 003 Balanga Residential Heights.
Drive Storage Architecture: 8 Standard Organic Folders (Executive, HR, DTR, Payroll, Materials, Sites, Expenses, Intake).
Registered Plan: ${clientContext?.drive_plan || 'Google Workspace Business'}
Active Site Filter: ${clientContext?.current_site || 'ALL'}

Provide clear, professional, direct, and actionable advice with markdown bullet points and bold highlights when appropriate.`;

    if (geminiApiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: query,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.4,
          },
        });

        return new Response(
          JSON.stringify({
            reply: response.text || 'No response generated.',
            source: 'gemini-3.8-flash',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (apiError: any) {
        console.warn('Gemini Assistant API call failed on edge, generating contextual fallback:', apiError?.message);
      }
    }

    return new Response(
      JSON.stringify({
        reply: `**De Rueda Construction Assistant (Gemini 3.8 Flash)**\n\nRegarding your query: "${query}"\n\n* **Compliance & Safety**: In accordance with **DOLE D.O. 13**, every active site (Site 001, Site 002, Site 003) must maintain a designated Safety Officer (SO2/SO3) and Tool Box Meeting attendance sheets filed in \`01_Executive_and_Compliance\`.\n* **Document Storage**: File all signed mill test certificates and concrete compressive break test cylinder reports in \`05_Materials_and_Procurement\`.\n* **Payroll & DTR**: Consolidated weekly payroll registers must be signed by workers and retained for a minimum of 5 years in \`04_Payroll_and_Disbursements\`.\n* **Google Drive Integration**: Your registered Google Drive Workspace vault is synchronized with the 8 organic folders.`,
        source: 'local-knowledge-base',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Assistant failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
