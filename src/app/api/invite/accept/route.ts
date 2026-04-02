import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token é obrigatório" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Use service client to bypass RLS for invite operations
    const serviceClient = createServiceClient();

    // Get the invite
    const { data: invite, error: inviteError } = await serviceClient
      .from("organization_invites")
      .select("id, organization_id, email, role, expires_at")
      .eq("token", token)
      .is("accepted_at", null)
      .single();

    if (inviteError || !invite) {
      // Check if invite exists but was already accepted
      const { data: acceptedInvite } = await serviceClient
        .from("organization_invites")
        .select("id, accepted_at")
        .eq("token", token)
        .not("accepted_at", "is", null)
        .single();

      if (acceptedInvite) {
        return NextResponse.json(
          { error: "Este convite já foi aceito", code: "already_accepted" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Convite não encontrado ou token inválido", code: "not_found" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Este convite expirou. Solicite um novo convite ao administrador.", code: "expired" },
        { status: 400 }
      );
    }

    // Check if user email matches invite email
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Este convite foi enviado para outro email. Faça logout e entre com o email correto.", code: "email_mismatch" },
        { status: 403 }
      );
    }

    // Profile should exist via handle_new_user() trigger
    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      console.warn(`Profile missing for user ${user.id} — trigger may have failed`);
    }

    // Add user as member (upsert to handle race conditions)
    // On conflict: UPDATE role/status so invite role is always applied
    const { error: memberError } = await serviceClient
      .from("organization_members")
      .upsert(
        {
          organization_id: invite.organization_id,
          user_id: user.id,
          role: invite.role,
          status: "active",
          accepted_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,user_id" }
      );

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: "Erro ao adicionar membro" },
        { status: 500 }
      );
    }

    // Mark invite as accepted
    const { error: updateError } = await serviceClient
      .from("organization_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Error marking invite as accepted:", updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
