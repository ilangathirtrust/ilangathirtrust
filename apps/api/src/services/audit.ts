import type { Request } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface AuditParams {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  req?: Request;
}

export async function recordAuditLog(params: AuditParams): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('audit_logs').insert({
      actor_id: params.actorId ?? null,
      actor_email: params.actorEmail ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      details: params.details ?? {},
      ip_address: params.req?.ip ?? null,
      user_agent: params.req?.get('user-agent')?.slice(0, 300) ?? null
    });
  } catch (err) {
    console.error('[AuditLog] Failed to persist audit log:', err);
  }
}

export async function saveContentVersion(params: {
  entityType: string;
  entityId: string;
  snapshot: Record<string, unknown>;
  changeNote?: string;
  changedBy?: string | null;
  changedByEmail?: string | null;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: latest } = await supabase
      .from('content_versions')
      .select('version_number')
      .eq('entity_type', params.entityType)
      .eq('entity_id', params.entityId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latest?.version_number ?? 0) + 1;
    await supabase.from('content_versions').insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      version_number: nextVersion,
      snapshot: params.snapshot,
      change_note: params.changeNote || `Version ${nextVersion}`,
      changed_by: params.changedBy ?? null,
      changed_by_email: params.changedByEmail ?? ''
    });
  } catch (err) {
    console.error('[ContentVersion] Failed to save content snapshot:', err);
  }
}
