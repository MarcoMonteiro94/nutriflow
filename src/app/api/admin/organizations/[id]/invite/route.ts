import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth/authorization";
import { createServiceClient } from "@/lib/supabase/server";
import { createInvite } from "@/lib/queries/organization";
import { logAuditEvent } from "@/lib/audit";
import type { OrgRole } from "@/types/database";

const VALID_ROLES: OrgRole[] = ["admin", "nutri", "receptionist", "patient"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = await requireSuperAdminApi();

    const { id } = await params;
    const body = await request.json();
    const { email, role } = body as { email?: string; role?: OrgRole };

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email e role são obrigatórios" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Role inválida" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Verify organization exists
    const supabase = createServiceClient();
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 404 }
      );
    }

    const { data: invite, error } = await createInvite(id, email, role);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invite!.token}`;

    await logAuditEvent({
      action: "invite.create",
      resourceType: "organization",
      resourceId: id,
      userId: userRole.userId,
      metadata: { email, role, invite_id: invite!.id },
    });

    return NextResponse.json(
      { data: { inviteUrl, invite_id: invite!.id } },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error creating admin invite:", error);
    return NextResponse.json(
      { error: "Erro ao criar convite" },
      { status: 500 }
    );
  }
}
