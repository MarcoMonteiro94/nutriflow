import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInvite, isUserOrgAdmin } from "@/lib/queries/organization";
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
    const { organizationId, email, role } = body as {
      organizationId: string;
      email: string;
      role: OrgRole;
    };

    if (!organizationId || !email || !role) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Verify user is admin
    const canInvite = await isUserOrgAdmin(organizationId);
    if (!canInvite) {
      return NextResponse.json(
        { error: "Sem permissão para convidar membros" },
        { status: 403 }
      );
    }

    const { data: invite, error } = await createInvite(organizationId, email, role);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invite!.token}`;

    // TODO: Send email with invite URL
    // For now, just return the invite URL for manual sharing
    // In production, integrate with email service (Resend, SendGrid, etc.)

    return NextResponse.json({
      success: true,
      invite: {
        id: invite!.id,
        email: invite!.email,
        role: invite!.role,
        inviteUrl,
        expiresAt: invite!.expires_at,
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
