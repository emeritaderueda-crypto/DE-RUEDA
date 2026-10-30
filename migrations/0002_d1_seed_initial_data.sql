-- =============================================================================
-- Cloudflare D1 Database Migration: 0002_d1_seed_initial_data.sql
-- Baseline Operational and Project Configuration
-- Safe execution: uses INSERT OR IGNORE to never overwrite existing records.
-- =============================================================================

-- 1. Metadata baseline
INSERT OR IGNORE INTO metadata (key, value, updated_at)
VALUES 
  ('system_name', 'De Rueda Construction ERP', datetime('now')),
  ('organization', 'De Rueda Construction Inc.', datetime('now')),
  ('environment', 'production', datetime('now')),
  ('database_version', '2.0.0', datetime('now'));

-- 2. Master Cut-off Fail-Closed Switch (Default: 0 = OFF/Engaged)
-- Ensures system fails closed until explicitly authorized by executive CEO
INSERT OR IGNORE INTO master_cutoff (id, switch_on, updated_at, updated_by, reason)
VALUES (
  1,
  0,
  datetime('now'),
  'security.initialization@deruedaconstruction.com',
  'Initial baseline cutover: Master cut-off engaged (fail-closed)'
);

-- 3. Developer Super Admin Account: marjoncompany@gmail.com
INSERT OR IGNORE INTO users (
  id,
  email,
  name,
  role,
  position,
  assigned_sites,
  company,
  password_hash,
  password_salt,
  mfa_enabled,
  mfa_secret,
  backup_codes,
  status,
  approved_by,
  approved_at,
  created_at,
  updated_at
) VALUES (
  'USR-DEV-MARJON',
  'marjoncompany@gmail.com',
  'Developer & Lead Systems Architect (Marjon Company)',
  'ceo',
  'Developer / Super Admin',
  '["ALL"]',
  'De Rueda Construction Inc.',
  '1b4f92f96bd1e9fdc4580f6f595edf232187bd8b755b06de5f6224db0aa16d1307c299092925bfab9ab4db29cae074a30139d465abf49af4e9e613f46287699a',
  'drc_salt_dev_2026',
  1,
  'JBSWY3DPEHPK3PXP',
  '["c1b07221b34bb7678fc7bbd5668aa1c8ff4a3901b87b7aebba7101adfe5606d39d91f216dd1972f7d6391a6d71b3e92cf4a01c40be6a89c8d5d14cf05c3c0d01"]',
  'active',
  'Corporate Charter / Developer Provisioning',
  datetime('now'),
  '2026-01-01T08:00:00Z',
  datetime('now')
);

-- 4. Executive CEO Account: emeritaderueda@gmail.com
INSERT OR IGNORE INTO users (
  id,
  email,
  name,
  role,
  position,
  assigned_sites,
  company,
  password_hash,
  password_salt,
  mfa_enabled,
  mfa_secret,
  backup_codes,
  status,
  approved_by,
  approved_at,
  created_at,
  updated_at
) VALUES (
  'USR-CEO-EMERITA',
  'emeritaderueda@gmail.com',
  'Emerita De Rueda',
  'ceo',
  'Chief Executive Officer (CEO)',
  '["ALL"]',
  'De Rueda Construction Inc.',
  '3ea75e47c1f8a846c4aa637da7576550ec4feef2287f34c26a02b793132e0e0a5bb86e885dcf545191cfaefcbb3d8c116ff1a0dbdaea502591ae9a04a5fb8cb6',
  'drc_salt_ceo_2026',
  1,
  'JBSWY3DPEHPK3PXP',
  '["c1b07221b34bb7678fc7bbd5668aa1c8ff4a3901b87b7aebba7101adfe5606d39d91f216dd1972f7d6391a6d71b3e92cf4a01c40be6a89c8d5d14cf05c3c0d01"]',
  'active',
  'Board of Directors / Corporate Charter',
  datetime('now'),
  '2026-01-01T08:00:00Z',
  datetime('now')
);

-- 5. Construction Site Projects Baseline
INSERT OR IGNORE INTO projects (site_id, name, location, status, progress, head_engineer, updated_at)
VALUES
  ('SITE-001', 'Mariveles Commercial Complex', 'Mariveles, Bataan', 'Active', 68.0, 'Engr. Marco De Rueda', datetime('now')),
  ('SITE-002', 'Subic Industrial Warehouse', 'Subic Bay Freeport Zone', 'Active', 42.0, 'Foreman Aris Valdez', datetime('now')),
  ('SITE-003', 'Balanga High-Rise Residences', 'Balanga City, Bataan', 'Active', 85.0, 'Foreman Danilo Santos', datetime('now'));

-- 6. Log migration completion
INSERT OR IGNORE INTO d1_migrations (version, applied_at, description)
VALUES ('0002_d1_seed_initial_data', datetime('now'), 'Baseline configuration and project seeds for De Rueda Construction ERP');
