import { GoogleGenAI } from '@google/genai';

interface Env {
  GEMINI_API_KEY?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const { file_name, notes, file_type } = body;

    if (!file_name) {
      return new Response(JSON.stringify({ error: 'file_name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = context.env?.GEMINI_API_KEY || '';

    const prompt = `You are the Gemini AI Document Classifier for De Rueda Construction Management System.
Classify this construction document into ONE of the 8 organic construction folders:
1. 01_Executive_and_Compliance (Corporate safety manuals, DOLE registrations, ISO protocols, municipal permits, tax clearances)
2. 02_Workforce_and_HR (Worker 201 files, SSS, PhilHealth, Pag-IBIG registrations, IDs, trade certifications, tesda certs)
3. 03_Timekeeping_and_DTR (Weekly DTR sheets, turnstile clocking logs, overtime slips, attendance change requests)
4. 04_Payroll_and_Disbursements (Signed weekly payroll registers, 6-per-page worker payslips, GCash receipts, cash vouchers)
5. 05_Materials_and_Procurement (Mill test certificates, rebar tests, delivery receipts [DR], purchase orders, concrete cylinder test logs)
6. 06_Project_Sites_and_Blueprints (Architectural & structural CAD drawings, civil permits, site inspection photos, site diary)
7. 07_Expenses_and_Equipment (Heavy equipment rental logs, crane leases, diesel fuel receipts, electric coop utility bills)
8. 08_Public_Intake_and_Tenders (Commercial client tenders, subcontracting proposals, field trades hiring submissions)

Document to classify:
File Name: "${file_name}"
Notes/Description: "${notes || 'None provided'}"
Format: "${file_type || 'PDF'}"

Respond strictly with valid JSON with this exact structure:
{
  "folder_code": "folder code (e.g. 05_Materials_and_Procurement)",
  "folder_name": "folder display name",
  "default_module": "Materials",
  "suggested_record_id": "suggested ID e.g. SITE-001 or 2026-W41 or MAT-REC",
  "tags": ["tag1", "tag2", "tag3"],
  "retention_years": 5,
  "summary": "1 sentence executive description of the document",
  "compliance_tip": "Specific Philippine construction compliance or DOLE standard tip for this file type"
}`;

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
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);
        return new Response(JSON.stringify(parsed), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (apiError: any) {
        console.warn('Gemini API call failed on edge, falling back to smart heuristic:', apiError?.message);
      }
    }

    // Rule-based fallback if API key is not ready or fails
    const lower = `${file_name} ${notes || ''}`.toLowerCase();
    let folder_code = '01_Executive_and_Compliance';
    let folder_name = '01. Executive & Compliance';
    let default_module = 'Company';
    let suggested_record_id = 'GLOBAL';

    if (lower.includes('steel') || lower.includes('cement') || lower.includes('rebar') || lower.includes('concrete') || lower.includes('dr-') || lower.includes('delivery') || lower.includes('po-')) {
      folder_code = '05_Materials_and_Procurement';
      folder_name = '05. Materials & Delivery Receipts';
      default_module = 'Materials';
      suggested_record_id = 'SITE-001';
    } else if (lower.includes('payroll') || lower.includes('payslip') || lower.includes('salary') || lower.includes('cash advance') || lower.includes('gcash')) {
      folder_code = '04_Payroll_and_Disbursements';
      folder_name = '04. Payroll & Disbursements';
      default_module = 'Payroll';
      suggested_record_id = '2026-W41';
    } else if (lower.includes('dtr') || lower.includes('attendance') || lower.includes('turnstile') || lower.includes('clock')) {
      folder_code = '03_Timekeeping_and_DTR';
      folder_name = '03. Timekeeping & Weekly DTR';
      default_module = 'Timekeeping';
      suggested_record_id = '2026-W41';
    } else if (lower.includes('crane') || lower.includes('fuel') || lower.includes('diesel') || lower.includes('expense') || lower.includes('utility') || lower.includes('rent')) {
      folder_code = '07_Expenses_and_Equipment';
      folder_name = '07. Equipment & Expenses';
      default_module = 'Expenses';
      suggested_record_id = 'SITE-001';
    } else if (lower.includes('blueprint') || lower.includes('cad') || lower.includes('drawing') || lower.includes('site') || lower.includes('permit') || lower.includes('structural')) {
      folder_code = '06_Project_Sites_and_Blueprints';
      folder_name = '06. Sites & Blueprints';
      default_module = 'Sites';
      suggested_record_id = 'SITE-001';
    } else if (lower.includes('worker') || lower.includes('sss') || lower.includes('philhealth') || lower.includes('201') || lower.includes('mason') || lower.includes('carpenter')) {
      folder_code = '02_Workforce_and_HR';
      folder_name = '02. Workforce & HR Files';
      default_module = 'Employees';
      suggested_record_id = 'DRC-EMP-2026-000001';
    }

    return new Response(
      JSON.stringify({
        folder_code,
        folder_name,
        default_module,
        suggested_record_id,
        tags: ['Construction', default_module, 'Organic-Vault'],
        retention_years: 5,
        summary: `Verified construction record classified under ${folder_name}.`,
        compliance_tip: 'Retain signed copies in the registered Google Drive project vault for DOLE and BIR audit compliance.',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Classification failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
