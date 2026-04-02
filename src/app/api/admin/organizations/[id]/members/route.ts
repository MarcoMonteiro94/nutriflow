import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth/authorization";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdminApi();

    const { id } = await params;
    const supabase = createServiceClient();

    // Verify organization exists
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

    const { data: members, error } = await supabase
      .from("organization_members")
      .select(
        `
        id, role, status, accepted_at, created_at,
        profiles!organization_members_user_id_fkey(id, full_name, email, is_active)
      `
      )
      .eq("organization_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching organization members:", error);
      return NextResponse.json(
        { error: "Erro ao buscar membros" },
        { status: 500 }
      );
    }

    const data = (members ?? []).map((member) => {
      const profile = member.profiles as unknown as {
        id: string;
        full_name: string;
        email: string;
        is_active: boolean;
      } | null;

      return {
        id: member.id,
        role: member.role,
        status: member.status,
        accepted_at: member.accepted_at,
        created_at: member.created_at,
        user: profile
          ? {
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              is_active: profile.is_active,
            }
          : null,
      };
    });

    return NextResponse.json({
      data,
      meta: { total: data.length },
    });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error fetching organization members:", error);
    return NextResponse.json(
      { error: "Erro ao buscar membros da organização" },
      { status: 500 }
    );
  }
}
