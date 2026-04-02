import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInvite } from "@/lib/queries/organization";
import { canInviteRole } from "@/lib/auth/authorization";
import type { OrgRole } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationId, email, role } = body;

    if (!organizationId || !email || !role) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    const validRoles: OrgRole[] = ["admin", "nutri", "receptionist", "patient"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Cargo inválido" },
        { status: 400 }
      );
    }

    // Get user's role in the organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    const { data: org } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", organizationId)
      .single();

    const isOwner = org?.owner_id === user.id;
    const userRole = (membership?.role as OrgRole) ?? (isOwner ? "admin" : null);

    if (!canInviteRole(userRole, role, isOwner)) {
      return NextResponse.json(
        { error: "Você não tem permissão para convidar membros com esse cargo" },
        { status: 403 }
      );
    }

    const { data: invite, error } = await createInvite(organizationId, email, role);

    if (error || !invite) {
      return NextResponse.json({ error: error ?? "Erro ao criar convite" }, { status: 400 });
    }

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invite.token}`;

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        inviteUrl,
        expiresAt: invite.expires_at,
      },
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
