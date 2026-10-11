# Cloudflare Pages Deployment Compatibility Plan

Make the De Rueda Construction ERP codebase fully compatible with GitHub and Cloudflare Pages deployment using npm only, with synchronized dependencies, verified build pipelines, Cloudflare Pages Functions for serverless API execution, and SPA routing rules.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed via interactive clarification:
> - **Backend API Architecture on Cloudflare Pages**: Serverless edge handlers in `functions/api/*` supporting Gemini AI (`classify-document`, `assistant`, `audit-drive`) and GCash merchant disbursement routes natively on Cloudflare Pages.
> - **Build Script Pipeline**: Strict TypeScript validation followed by production bundle generation (`tsc --noEmit && vite build`).
> - **SPA Routing & Edge Headers**: `public/_redirects` (`/* /index.html 200`) and security headers that maintain iframe compatibility without restrictive blocking policies.
> - **Package Manager & Lockfile**: Exclusive npm ecosystem with no Bun lockfiles or artifacts, accompanied by a verified `package-lock.json`.

---

## 1. Overview & Core Concept

- **What It Delivers**: A production-ready repository that builds deterministically on both local development/AI Studio runtime (`tsx server.ts` on port 3000) and Cloudflare Pages CI/CD pipeline (`npm run build` targeting `dist`, with serverless edge functions in `functions/api/`).
- **Target Platform**: Cloudflare Pages (Git integration via GitHub).
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`
  - **Root directory**: `/`
  - **Environment variables**: `GEMINI_API_KEY` configured in Cloudflare Pages dashboard.

---

## 2. User Experience & Visual Design

The De Rueda Construction ERP user experience remains completely intact with no disruption or regression to existing features:
- **Visual System**: Enterprise dark emerald aesthetic (`#080f0d` base, `#10b981` primary, `#a3e635` accent) with high-density tabular data grids, QR attendance scanning, 6-per-page printable payslips, and GCash official SVG receipt vouchers.
- **Top Bar Contract**: Clean 3-zone header with DRC wordmark, navigation controls, and primary action buttons.
- **Micro-Interactions**: Tabular numerals (`tabular-nums`) across payroll, cash flow, and attendance metrics; non-blocking alerts and feedback banners for letter-size export and batch disbursements.

---

## 3. Key Product Decisions & Trade-Offs

- **Dual-Runtime Backend Support (Express Dev + Cloudflare Pages Functions)**:
  - *Chosen Approach*: Maintain `server.ts` (Express + Vite middleware) for local development and AI Studio dev server, while implementing clean Web API standard handlers in `functions/api/*` for Cloudflare Pages production deployment.
  - *Why*: Cloudflare Pages automatically detects the `functions/` directory and deploys serverless edge workers without needing a Node server process. Local dev uses `server.ts` so developers can run `npm run dev` out of the box.
  - *Alternative Considered*: Static-only SPA with no backend on Cloudflare. Rejected because it would disable server-side Gemini 3.8 Flash analysis and GCash receipts in production.

- **Strict Validation in `npm run build`**:
  - *Chosen Approach*: `"build": "tsc --noEmit && vite build"`.
  - *Why*: Ensures any type mismatch or broken import fails fast during CI before deploying broken assets.

- **Non-Breaking Security & SPA Redirect Headers**:
  - *Chosen Approach*: Provide `public/_redirects` with `/* /index.html 200` to prevent 404s on deep links or manual refreshes. Exclude legacy `X-Frame-Options: SAMEORIGIN` so the application continues to preview seamlessly in AI Studio while setting modern CSP, nosniff, and referrer-policy headers.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    De Rueda Construction ERP                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Cloudflare Pages Production │        │  Local Dev / AI Studio Dev   │
│  Build: npm run build        │        │  Run: npm run dev            │
│  Output: dist                │        │  Server: tsx server.ts:3000  │
└──────────────┬───────────────┘        └──────────────┬───────────────┘
               │                                       │
     ┌─────────┴─────────┐                   ┌─────────┴─────────┐
     ▼                   ▼                   ▼                   ▼
┌─────────────┐   ┌─────────────┐     ┌─────────────┐   ┌─────────────┐
│ Static SPA  │   │ Edge Funcs  │     │ Vite Dev    │   │ Express API │
│ (dist)      │   │ functions/  │     │ Middlewares │   │ server.ts   │
└─────────────┘   └─────────────┘     └─────────────┘   └─────────────┘
```

### Component & File Mapping

1. **Package Configuration (`package.json`)**:
   - Set `"build": "tsc --noEmit && vite build"`.
   - Ensure scripts and engines strictly target standard Node.js & npm (`node: ">=18.0.0"`, `npm: ">=9.0.0"`).
   - Ensure all dependencies used across client and edge functions are declared.

2. **Cloudflare Pages Serverless Edge Functions (`functions/api/`)**:
   - `functions/api/health.ts`: Edge health check verifying environment and Gemini status.
   - `functions/api/gemini/classify-document.ts`: Edge endpoint calling `@google/genai` or heuristic fallback using `context.env.GEMINI_API_KEY`.
   - `functions/api/gemini/assistant.ts`: Edge copilot endpoint for construction & DOLE advisory.
   - `functions/api/gemini/audit-drive.ts`: Edge audit endpoint for project compliance scoring.
   - `functions/api/gcash/wallet.ts`: Edge corporate wallet balance & gateway inquiry.
   - `functions/api/gcash/disburse.ts`: Edge single worker disbursement generating SVG official receipts.
   - `functions/api/gcash/batch-disburse.ts`: Edge batch worker disbursement generator.

3. **Routing & Headers Configuration (`public/`)**:
   - `public/_redirects`: `/* /index.html 200` for client-side React SPA routing.
   - `public/_headers`: Security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).

4. **Package Lockfile & Dependency Hygiene**:
   - Clean up any stray lockfiles (`bun.lock`, `bun.lockb`, `yarn.lock`, `pnpm-lock.yaml`).
   - Run `npm install` to generate and verify an up-to-date, pristine `package-lock.json`.
   - Run `npm run build` to confirm compilation completes with 0 errors.

5. **Cloudflare Pages Deployment Documentation**:
   - Add clear deployment instructions in `README.md` specifying build command (`npm run build`), build output directory (`dist`), and Node version compatibility.
