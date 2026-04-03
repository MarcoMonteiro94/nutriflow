import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth/authorization";
import {
  deactivateOrganization,
  reactivateOrganization,
} from "@/lib/queries/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminApi();

    const { id } = await params;
    const body = await request.json();
    const { is_active } = body as { is_active?: boolean };

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "Campo is_active (boolean) é obrigatório" },
        { status: 400 }
      );
    }

    // Verify organization exists
    const supabase = createServiceClient();
    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("id, name, slug, is_active, owner_id, created_at, updated_at")
      .eq("id", id)
      .single();

    if (fetchError || !org) {
      return NextResponse.json(
        { error: "Organização não encontrada" },
        { status: 404 }
      );
    }

    if (is_active) {
      await reactivateOrganization(id);
    } else {
      await deactivateOrganization(id);
    }

    return NextResponse.json({
      data: { ...org, is_active },
    });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar organização" },
      { status: 500 }
    );
  }
}
