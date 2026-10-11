# De Rueda Construction ERP

Enterprise construction management software for De Rueda Construction, featuring real-time attendance QR, weekly DTR timekeeping, payroll calculations, 6-per-page printable payslips, GCash merchant disbursements, materials procurement tracking, and AI-driven document intelligence.

---

## Cloudflare Pages Deployment Guide

This project is configured for direct deployment on **Cloudflare Pages** connected to your GitHub repository.

### Build & Project Configuration

| Setting | Value |
|---|---|
| **Framework preset** | Vite |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (leave blank) |
| **Package Manager** | `npm` (uses `package-lock.json`) |

### Environment Variables

Configure the following environment variables in your Cloudflare Pages project settings (**Settings > Environment variables**):

- `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key to enable serverless AI features (smart document classifier, DOLE safety copilot, and Google Drive vault compliance audit).
- `NODE_VERSION`: `20` or `22`

### Cloudflare Pages Architecture

1. **Static Frontend (`dist/`)**: Vite compiles the React 19 SPA with Tailwind CSS into `dist/`.
2. **SPA Client-Side Routing (`public/_redirects`)**: Contains `/* /index.html 200` to support direct deep-linking across views without 404 errors.
3. **Serverless Edge APIs (`functions/api/`)**: Cloudflare Pages automatically discovers and runs Edge Functions in `functions/`:
   - `/api/health`: System health status and edge configuration.
   - `/api/gemini/classify-document`: Auto-categorizes construction records into 8 organic project vault folders.
   - `/api/gemini/assistant`: Construction & DOLE D.O. 13 copilot advisory.
   - `/api/gemini/audit-drive`: Executive compliance auditor.
   - `/api/gcash/wallet`: Merchant corporate wallet balance.
   - `/api/gcash/disburse`: Single-worker salary disbursement with official SVG voucher.
   - `/api/gcash/batch-disburse`: Batch payout generator.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (optional)
cp .env.example .env

# 3. Start local development server (runs fullstack Express + Vite on port 3000)
npm run dev

# 4. Validate TypeScript and build for production
npm run build
```

---

## Verification & Quality Assurance

- `npm run lint` passes with 0 TypeScript errors (`tsc --noEmit`).
- `npm run build` validates TypeScript and outputs a minified, production-optimized bundle to `dist/`.
- No Bun or alternative package manager lockfiles are used (`npm` and `package-lock.json` only).
