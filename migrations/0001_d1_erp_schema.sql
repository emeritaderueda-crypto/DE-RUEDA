-- =============================================================================
-- Cloudflare D1 Database Migration: 0001_d1_erp_schema.sql
-- De Rueda Construction ERP - Production Relational Schema
-- =============================================================================

-- Metadata and migration version tracking
CREATE TABLE IF NOT EXISTS d1_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Master Cut-Off Fail-Closed Security Switch
CREATE TABLE IF NOT EXISTS master_cutoff (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  switch_on INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS master_cutoff_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL,
  new_state TEXT NOT NULL,
  reason TEXT NOT NULL,
  result TEXT NOT NULL
);

-- Authoritative Corporate Accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  position TEXT NOT NULL,
  assigned_sites TEXT NOT NULL DEFAULT '["ALL"]',
  company TEXT NOT NULL DEFAULT 'De Rueda Construction Inc.',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  mfa_enabled INTEGER NOT NULL DEFAULT 1,
  mfa_secret TEXT NOT NULL,
  backup_codes TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Server Sessions (D1 Edge Persistence)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  user_data TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Corporate Invitation Tokens (Invitation-Only Policy)
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  company TEXT NOT NULL,
  assigned_role TEXT NOT NULL,
  assigned_position TEXT NOT NULL,
  assigned_sites TEXT NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  used_at TEXT,
  used_by_user_id TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- Immutable Security Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  target_email TEXT,
  details TEXT NOT NULL,
  status TEXT NOT NULL,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Idempotency Store (Guards duplicate payouts & transactions)
CREATE TABLE IF NOT EXISTS idempotency_store (
  key TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  result TEXT NOT NULL
);

-- Site & Project Status Tracking
CREATE TABLE IF NOT EXISTS projects (
  site_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  head_engineer TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Cash Voucher Proof & Handover Receipts
CREATE TABLE IF NOT EXISTS cash_receipts (
  receipt_id TEXT PRIMARY KEY,
  payroll_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  pay_period TEXT NOT NULL,
  amount REAL NOT NULL,
  photo_evidence_url TEXT NOT NULL,
  confirmed_by TEXT NOT NULL,
  confirmed_role TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  witness_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_cash_receipts_payroll_id ON cash_receipts(payroll_id);

INSERT OR IGNORE INTO d1_migrations (version, applied_at, description)
VALUES ('0001_d1_erp_schema', datetime('now'), 'Initial schema for De Rueda Construction ERP');
