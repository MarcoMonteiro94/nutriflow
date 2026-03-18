import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type AuditAction =
  | "patient.link_account"
  | "patient.unlink_account"
  | "patient.export_data"
  | "patient.create"
  | "invite.create"
  | "invite.accept"
  | "member.role_change"
  | "member.remove"
  | "anamnesis.analyze"
  | "token.create"
  | "token.access";

interface AuditLogParams {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}

/**
 * Log an audit event for sensitive operations.
 * Fire-and-forget — does not throw on failure.
 */
export async function logAuditEvent({
  action,
  resourceType,
  resourceId,
  metadata,
  userId,
}: AuditLogParams): Promise<void> {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      null;

    // Get user ID if not provided
    let uid = userId;
    if (!uid) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      uid = user?.id;
    }

    // Use type assertion since audit_logs may not be in generated types yet
    await (supabase as any).from("audit_logs").insert({
      user_id: uid ?? null,
      action,
      resource_type: resourceType,
      resource_id: resourceId ?? null,
      metadata: metadata ?? {},
      ip_address: ip,
    });
  } catch {
    // Audit logging should never break the main flow
    console.error("Failed to log audit event:", action);
  }
}
