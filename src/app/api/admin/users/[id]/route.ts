import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth/authorization";
import { deactivateUser } from "@/lib/queries/admin";
import { logAuditEvent } from "@/lib/audit";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = await requireSuperAdminApi();

    const { id } = await params;
    const body = await request.json();
    const { is_active } = body as { is_active?: boolean };

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "Campo is_active (boolean) é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify user exists
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_active, role, created_at")
      .eq("id", id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Prevent deactivating yourself
    if (id === userRole.userId && !is_active) {
      return NextResponse.json(
        { error: "Você não pode desativar sua própria conta" },
        { status: 400 }
      );
    }

    if (!is_active) {
      await deactivateUser(id);
    } else {
      // Reactivate user
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("id", id);

      if (updateError) {
        throw new Error(`Failed to reactivate user: ${updateError.message}`);
      }

      await logAuditEvent({
        action: "user.reactivate",
        resourceType: "user",
        resourceId: id,
        userId: userRole.userId,
        metadata: { target_user_id: id },
      });
    }

    return NextResponse.json({
      data: { ...profile, is_active },
    });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}
