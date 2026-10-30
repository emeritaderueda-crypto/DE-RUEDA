import { PagesEnv, jsonResponse, errorResponse, CORS_HEADERS } from '../_common.js';
import { d1ExportDatabase, d1ImportDatabase, d1GetSession } from '../../../src/server/d1Database.js';

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  // Authorization check: Bearer token must be provided
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return errorResponse('Authentication required to restore database', 401);
  }

  if (!env.DB) {
    return errorResponse('D1 database binding is not configured in this Cloudflare Pages environment.', 503);
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON payload', 400);
  }

  const { backupData } = body;
  if (!backupData) {
    return errorResponse('Missing backupData in request body', 400);
  }

  // Extract the inner database schema if wrapped in our standard export structure
  const rawSchema = backupData.database || backupData;
  if (!rawSchema.version || !Array.isArray(rawSchema.users)) {
    return errorResponse('Invalid backup structure: missing schema version or users collection.', 400);
  }

  try {
    const session = await d1GetSession(env.DB, token);
    if (!session || (session.user.role !== 'ceo' && session.user.role !== 'admin 1')) {
      return errorResponse('Forbidden: Executive CEO or Admin 1 authorization required for database restore.', 403);
    }

    // 1. Generate pre-restore safety rollback snapshot first
    const preRestoreSnapshot = await d1ExportDatabase(env.DB);

    // 2. Execute restoration into D1
    const result = await d1ImportDatabase(env.DB, rawSchema, session.user.email);

    return jsonResponse({
      success: true,
      message: result.message,
      users_restored: result.usersCount,
      pre_restore_snapshot_id: `DRC_PRE_RESTORE_${Date.now()}`,
      pre_restore_snapshot: preRestoreSnapshot,
    });
  } catch (err: any) {
    return errorResponse(`Database restore failed: ${err?.message || err}`, 500);
  }
}
