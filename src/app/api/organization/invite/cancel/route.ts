import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

    // Fetch the invite
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
        { error: "Você não tem permissão para cancelar este convite" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await serviceClient
      .from("organization_invites")
      .delete()
      .eq("id", inviteId);

    if (deleteError) {
      console.error("Error cancelling invite:", deleteError);
      return NextResponse.json(
        { error: "Erro ao cancelar convite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling invite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
