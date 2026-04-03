import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth/authorization";
import { getPlatformStats } from "@/lib/queries/admin";

export async function GET() {
  try {
    await requireSuperAdminApi();
    const stats = await getPlatformStats();
    return NextResponse.json({ data: stats });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error fetching platform stats:", error);
    return NextResponse.json(
      { error: "Erro ao buscar métricas da plataforma" },
      { status: 500 }
    );
  }
}
