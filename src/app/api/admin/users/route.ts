import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth/authorization";
import { getAllUsers } from "@/lib/queries/admin";
import type { OrgRole } from "@/types/database";

const VALID_ROLES: OrgRole[] = ["admin", "nutri", "receptionist", "patient"];

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminApi();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as OrgRole | null;
    const orgId = searchParams.get("orgId") || undefined;
    const search = searchParams.get("search") || undefined;

    const filters: { role?: OrgRole; orgId?: string; search?: string } = {};
    if (role && VALID_ROLES.includes(role)) filters.role = role;
    if (orgId) filters.orgId = orgId;
    if (search) filters.search = search;

    const users = await getAllUsers(filters);

    return NextResponse.json({
      data: users,
      meta: { total: users.length },
    });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}
