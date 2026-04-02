import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth/authorization";
import { getAllOrganizations } from "@/lib/queries/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminApi();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") || undefined;

    const filters: { isActive?: boolean; search?: string } = {};
    if (status === "active") filters.isActive = true;
    if (status === "inactive") filters.isActive = false;
    if (search) filters.search = search;

    const organizations = await getAllOrganizations(filters);

    return NextResponse.json({
      data: organizations,
      meta: { total: organizations.length },
    });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Erro ao buscar organizações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = await requireSuperAdminApi();

    const body = await request.json();
    const { name, slug } = body as { name?: string; slug?: string };

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nome e slug são obrigatórios" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug deve conter apenas letras minúsculas, números e hífens" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if slug is available
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: "Este slug já está em uso" },
        { status: 409 }
      );
    }

    // Create org with super admin as owner
    const { data: org, error } = await supabase
      .from("organizations")
      .insert({ name, slug, owner_id: userRole.userId })
      .select("id, name, slug, owner_id, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error creating organization:", error);
      return NextResponse.json(
        { error: "Erro ao criar organização" },
        { status: 500 }
      );
    }

    // Add super admin as admin member
    await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: userRole.userId,
      role: "admin",
      status: "active",
      accepted_at: new Date().toISOString(),
    });

    await logAuditEvent({
      action: "org.create",
      resourceType: "organization",
      resourceId: org.id,
      userId: userRole.userId,
      metadata: { name, slug },
    });

    return NextResponse.json({ data: org }, { status: 201 });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Erro ao criar organização" },
      { status: 500 }
    );
  }
}
