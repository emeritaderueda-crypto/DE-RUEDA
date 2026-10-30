import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS } from '../_common.js';
import { d1ExportDatabase, d1GetSession } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  // Authorization check: Bearer token must be provided
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return errorResponse('Authentication required to export database backup', 401);
  }

  if (!env.DB) {
    return errorResponse('D1 database binding is not configured in this Cloudflare Pages environment.', 503);
  }

  try {
    const session = await d1GetSession(env.DB, token);
    if (!session || (session.user.role !== 'ceo' && session.user.role !== 'admin 1')) {
      return errorResponse('Forbidden: Executive CEO or Admin 1 authorization required for database export.', 403);
    }

    const backupSchema = await d1ExportDatabase(env.DB);
    const serializedData = JSON.stringify(backupSchema);

    // Calculate SHA-256 integrity checksum using Web Crypto
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serializedData));
    const checksum = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const now = new Date();
    const timestampStr = now.toISOString();
    const dateFormatted = timestampStr.slice(0, 10).replace(/-/g, '');
    const timeFormatted = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const backupId = `DRC_D1_BACKUP_${dateFormatted}_${timeFormatted}`;

    const completeBackup = {
      system_signature: 'De Rueda Construction Management System',
      schema_version: '2.0.0',
      backup_id: backupId,
      timestamp: timestampStr,
      exported_by: session.user.email,
      exported_role: session.user.role,
      storage_architecture: {
        primary_database: 'Cloudflare D1 (Production)',
        long_term_archive: 'Google Drive Manual Vault',
        google_drive_folder_url: 'https://drive.google.com/drive/folders/1BUusZTUKtHYI3OfghaNkgZWQgQiMhDfy',
        sync_mode: 'Manual Off-Site Upload (D1 Independent)',
      },
      integrity: {
        algorithm: 'SHA-256',
        checksum,
      },
      record_counts: {
        users: backupSchema.users.length,
        invitations: backupSchema.invitations.length,
        audit_logs: backupSchema.audit_logs.length,
        projects: backupSchema.projects.length,
        cash_receipts: backupSchema.cash_receipts.length,
      },
      database: backupSchema,
    };

    return jsonResponse({
      success: true,
      backup_id: backupId,
      filename: `derueda_d1_backup_${timestampStr.slice(0, 10)}_${timeFormatted}.json`,
      integrity_checksum: checksum,
      backup: completeBackup,
    });
  } catch (err: any) {
    return errorResponse(`Database export failed: ${err?.message || err}`, 500);
  }
}
