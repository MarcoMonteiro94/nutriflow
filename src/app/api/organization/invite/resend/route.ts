import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

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
    const { inviteId } = body as { inviteId?: string };

    if (!inviteId) {
      return NextResponse.json(
        { error: "inviteId é obrigatório" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Fetch the existing invite
    const { data: invite, error: fetchError } = await serviceClient
      .from("organization_invites")
      .select("*")
      .eq("id", inviteId)
      .is("accepted_at", null)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json(
        { error: "Convite não encontrado" },
        { status: 404 }
      );
    }

    // Verify user belongs to the organization
    const { data: membership } = await serviceClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", invite.organization_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    const { data: org } = await serviceClient
      .from("organizations")
      .select("owner_id")
      .eq("id", invite.organization_id)
      .single();

    const isOwner = org?.owner_id === user.id;

    if (!membership && !isOwner) {
      return NextResponse.json(
        { error: "Você não tem permissão para reenviar este convite" },
        { status: 403 }
      );
    }

    // Generate new token and expiry
    const newToken = nanoid(32);
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    const { error: updateError } = await serviceClient
      .from("organization_invites")
      .update({
        token: newToken,
        expires_at: newExpiry.toISOString(),
      })
      .eq("id", inviteId);

    if (updateError) {
      console.error("Error resending invite:", updateError);
      return NextResponse.json(
        { error: "Erro ao reenviar convite" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${newToken}`;

    return NextResponse.json({
      success: true,
      data: {
        inviteUrl,
        token: newToken,
        expires_at: newExpiry.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error resending invite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
