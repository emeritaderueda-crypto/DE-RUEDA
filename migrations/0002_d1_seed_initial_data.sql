-- =============================================================================
-- Cloudflare D1 Database Migration: 0002_d1_seed_initial_data.sql
-- Baseline Operational and Project Configuration
-- Safe execution: uses INSERT OR IGNORE to never overwrite existing records.
-- Production Security: Zero predefined credentials, password hashes, or MFA secrets.
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

-- 3. Construction Site Projects Baseline
INSERT OR IGNORE INTO projects (site_id, name, location, status, progress, head_engineer, updated_at)
VALUES
  ('SITE-001', 'Mariveles Commercial Complex', 'Mariveles, Bataan', 'Active', 68.0, 'Engr. Marco De Rueda', datetime('now')),
  ('SITE-002', 'Subic Industrial Warehouse', 'Subic Bay Freeport Zone', 'Active', 42.0, 'Foreman Aris Valdez', datetime('now')),
  ('SITE-003', 'Balanga High-Rise Residences', 'Balanga City, Bataan', 'Active', 85.0, 'Foreman Danilo Santos', datetime('now'));

-- 4. Log migration completion
INSERT OR IGNORE INTO d1_migrations (version, applied_at, description)
VALUES ('0002_d1_seed_initial_data', datetime('now'), 'Baseline configuration and project seeds for De Rueda Construction ERP');
