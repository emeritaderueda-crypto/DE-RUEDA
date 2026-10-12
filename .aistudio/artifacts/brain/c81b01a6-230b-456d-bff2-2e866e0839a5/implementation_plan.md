# De Rueda Construction Management System — Canteen Reporting, Offline Service Worker & System Upgrade Plan

A comprehensive architectural blueprint and upgrade roadmap uniting the 18-page Execution, Security & Upgrade Plan with new Canteen Spending Aggregation reporting and resilient field offline sync.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following directions were confirmed during Phase 1 interactive clarification and govern this implementation:

- **Confirmed Decision 1 (Roadmap & Feature Scope)**: Full upgrade execution — implement the new Canteen Spending Aggregator report tab and service worker offline sync alongside roadmap governance, role-based boundary containment, and audit hardening.
- **Confirmed Decision 2 (Canteen Reports View Architecture)**: Provide a 3-way view mode toggle within the new Canteen Spending Aggregator tab:
  1. *Hierarchical Site Breakdown* (collapsible site groups with employee deduction rows and site subtotals).
  2. *Flat Searchable Ledger* (high-density table with multi-factor search, site filter, and status badges).
  3. *Executive Summary Cards* (high-level KPI tiles with an employee drill-down modal/drawer).
- **Confirmed Decision 3 (Offline Sync & Queue Processing)**: Implement a complete multi-tier offline workflow:
  1. *Automatic background sync* on network restoration with visual queue badges.
  2. *Manual Inspection & Review Drawer* allowing timekeepers to inspect, edit, or purge queued offline canteen records.
  3. *Confirmation dialog* with instant single-click batch sync.

---

## 1. Overview & Core Concept

### What It Does
1. **Canteen Spending Aggregation (Reports Hub)**: Adds a dedicated, multi-mode aggregation tab in the Reports View that consolidates all employee meal withholdings, cycle weeks, and concessionaire payouts. Computes site-specific totals, weekly deduction totals, worker-level subtotals, and exports to PDF, Excel (.xlsx), Word (.doc), and CSV.
2. **Service Worker Offline Caching & Menu Cache**: Upgrades the existing service worker (`/public/sw.js`) to cache the accredited canteen menu standards, daily meal packages, and pricing tables with Stale-While-Revalidate and Cache-First strategies.
3. **Local Pending Transaction Queue (Offline Resilient)**: Allows site timekeepers in low-connectivity areas (e.g. Mariveles, Subic Bay reclamation zones) to record employee meal chits, custom deductions, and concessionaire settlements offline. Transactions are stored safely in browser storage and IndexedDB queues with an amber offline status banner, an offline sync badge, and an expandable review drawer.
4. **Governance & Security Containment (Roadmap Alignment)**: Deploys the Phase 0–1 safeguards from the 12 October 2026 roadmap document:
   - Clear *Demo & Simulation Notice* banner explaining that live GCash fund movement is simulated and sandboxed pending merchant credential activation.
   - Enforced server/client role boundaries separating CEO (executive authorization, passkey verification), Lead Admin / A1 (payroll preparation, DTR locks), and Site Ops / A2 (site attendance, local canteen entry).
   - Immutable audit logging with structured metadata and export controls.

### Target Audience & Persona
- **Corporate CEO & Finance Directors (Emerita / Engr. Marco De Rueda)**: Real-time oversight over corporate cash flow, canteen meal deductions vs. GCash disbursements, and compliance.
- **Project Superintendents & Site Ops (Engr. Valdez, Engr. Santos)**: Seamless recording of worker meals in low-signal excavation zones without data loss or duplicate charges.
- **Timekeepers & Concessionaires**: Instant print-ready billing vouchers, digital meal chit passes, and cross-site reconciliation.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Navigating to Canteen Spending Aggregator**:
   - User opens the **Reports Hub** and selects the new dedicated **"Canteen Spending Aggregator"** view (or Report #16).
   - User switches between **Hierarchical by Site**, **Flat Searchable Ledger**, and **Executive Cards** view modes.
   - User filters by Site, Payroll Cycle Week, or searches by worker name / ID.
   - User clicks **Download PDF / Excel / CSV / Print** to obtain authenticated, formatted outputs with official DRC headers.
2. **Offline Field Mode & Menu Browsing**:
   - Timekeeper goes offline on-site. The UI displays an amber **"Site Offline — Local Queue Active"** banner.
   - The canteen menu remains 100% accessible and scannable via service worker cache.
   - Timekeeper adds single or batch meal deductions. The system queues them locally, updates the **Pending Sync Queue Badge**, and logs the record.
3. **Reconnection & Synchronization**:
   - Network reconnects (`online` event fires).
   - Timekeeper can inspect the **Pending Offline Queue Drawer** (viewing records, site, timestamps, amount), trigger **Sync Now**, or let the automatic background sync process the batch with a completion toast.

### Visual Identity & Theme
- **Color Palette & Theme Tokens**:
  - Neutral Background: Deep charcoal / slate `#080f0d` with structural surface `#0e1a16` and card containers `#13241f`.
  - Border Lines: Subdued hairline borders `#234338` (never garish drop shadows).
  - Primary Accent: DRC Construction Emerald / Lime `#a3e635` and `#10b981`.
  - Offline & Warning Accents: Amber `#f59e0b` and `#d97706` for offline queues and pending states.
- **Typography & Hierarchy**:
  - Display Font: `Plus Jakarta Sans` for crisp titles and clean hierarchy.
  - Telemetry & Financials: Monospace `JetBrains Mono` and `tabular-nums` for all peso figures, timestamps, and reference IDs to prevent jitter.
- **Zero-Pill Discipline & Anti-Slop Guidelines**:
  - No decorative static pill enclosures for metadata; use clean unboxed text separated by `·` or `/`.
  - Functional segmented buttons for view toggling (`Hierarchical` | `Flat Ledger` | `Executive Summary`).
  - Single-line controls with `whitespace-nowrap shrink-0`.
  - Truthful status indicators (no fake latency counters or hallucinated scores).

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Why | Alternatives Considered |
|---|---|---|---|
| **Canteen Reporting Architecture** | 3-in-1 View Switcher (Hierarchical, Flat Table, Executive Cards) | Fulfills the user's explicit request ("all three are good apply it") and provides both bird's-eye executive views and granular audit lines. | Single monolithic table (fails on multi-site scans). |
| **Offline Storage Engine** | Unified Local Queue backed by `localStorage` + Service Worker Cache API | Immediate cross-component synchronization within React context without requiring external heavy database drivers during client build. | IndexedDB-only without context bindings (adds unnecessary async latency to instant form inputs). |
| **Service Worker Strategy** | Network-First with Cache Fallback for App/API, Cache-First for static assets & Canteen Menu | Ensures the app always fetches fresh data when connected, while falling back gracefully to cached menu data and shell when disconnected. | Pure Cache-First (risks serving stale financial balances). |
| **Roadmap Containment & RBAC** | Explicit Sandbox/Simulation Banner + Role Permission Gate | Solves the primary P0/P1 warning in the 18-page audit: making it crystal clear to users and auditors that money movement is in verified simulation mode. | Silent mock execution (misleading to stakeholders). |

---

## 4. Technical Architecture & Data Strategy

### System & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        De Rueda Construction ERP                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌───────────────────────────┐                       ┌────────────────────┐
│      Reports Hub View     │                       │  Canteen & Meal    │
│  ┌─────────────────────┐  │                       │  Operations Hub    │
│  │ Canteen Aggregator  │  │                       └─────────┬──────────┘
│  │  - Hierarchical     │  │                                 │
│  │  - Flat Ledger      │  │                                 │
│  │  - Executive Cards  │  │                                 │
│  │  - PDF/Excel Export │  │                                 │
│  └─────────────────────┘  │                                 │
└─────────────┬─────────────┘                                 │
              │                                               │
              ▼                                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Application Context & State                      │
│   • deduplication & recalculatePayroll                                 │
│   • addBatchDeductions & syncOfflineQueue                              │
│   • pendingOfflineCanteenQueue [ { id, empId, siteId, amount... } ]    │
│   • isOnline / networkStatus Listener                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌───────────────────────────┐                       ┌────────────────────┐
│   Service Worker (sw.js)  │                       │   Local Storage    │
│   • /api/canteen/menu     │                       │   & Audit Log      │
│   • App shell precache    │                       │   • Pending Queue  │
│   • Offline synthetic 200 │                       │   • Durable Drafts │
└───────────────────────────┘                       └────────────────────┘
```

### Data Models

```typescript
// Canteen Aggregation Report Item
export interface CanteenSpendingSummary {
  site_id: string;
  site_code: string;
  site_name: string;
  vendor_name: string;
  gcash_number: string;
  total_workers_served: number;
  total_meal_charges: number;
  total_gcash_settled: number;
  net_outstanding_balance: number;
  workers: Array<{
    employee_id: string;
    employee_name: string;
    position: string;
    cycle_week: string;
    meal_charge: number;
    notes?: string;
  }>;
}

// Offline Pending Canteen Transaction Item
export interface PendingOfflineCanteenRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  site_id: string;
  week_key: string;
  amount: number;
  notes: string;
  created_at: string;
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
}
```

### Implementation Steps

1. **Service Worker Enhancement (`/public/sw.js`)**:
   - Add specialized caching route for `/api/canteen/menu` and canteen assets.
   - Return cached JSON menu standards (Breakfast ₱40, Lunch ₱70, Dinner ₱60, Heavy ₱100) even when completely offline.
2. **Context & State Management (`/src/context/AppContext.tsx` & `/src/types/index.ts`)**:
   - Add `pendingOfflineCanteenQueue` state and storage persistence.
   - Implement `addOfflineCanteenCharge(record)` and `syncPendingCanteenQueue()`.
   - Add event listeners for `window.addEventListener('online')` to auto-trigger queue sync.
3. **New Canteen Aggregator Tab in Reports View (`/src/components/views/ReportsView.tsx`)**:
   - Add top-level view selector or tab for **"Canteen Spending Aggregator"**.
   - Build 3 viewing sub-modes:
     - **Mode A: Hierarchical by Site**: Accordion/cards per construction site displaying site totals, vendor details, and expandable employee deduction roster.
     - **Mode B: Flat Searchable Ledger**: High-density sortable table with worker ID, trade, site code, cycle week, amount, settlement status, and live search.
     - **Mode C: Executive Summary Cards**: Quick-glance KPI cards with total weekly deductions, total settled, outstanding balance, and drill-down modal for worker breakdown.
   - Wire export handlers: Print-ready layout, PDF generator (`jspdf-autotable`), Excel (`xlsx`), and CSV.
4. **Offline UI & Sync Drawer in Canteen & Navigation**:
   - Provide visual offline indicator and pending badge in the header/canteen action bar.
   - Expandable **Offline Queue Drawer** to inspect, edit, delete, or sync queued transactions.
5. **Roadmap Governance & Security Banner**:
   - Add top-bar/header badge: **"System Roadmap Compliance: Simulation Sandbox Mode"** with modal detailing Phase 0–1 security safeguards and verified role controls.
6. **Verification & Build**:
   - Run `lint_applet` and `compile_applet` to ensure zero compilation or type errors.
