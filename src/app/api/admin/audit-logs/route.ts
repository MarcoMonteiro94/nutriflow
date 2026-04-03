import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/auth/authorization";
import { getAuditLogs } from "@/lib/queries/admin";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminApi();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const filters: {
      action?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {};
    if (action) filters.action = action;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const logs = await getAuditLogs(filters);

    return NextResponse.json({
      data: logs,
      meta: { total: logs.length },
    });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Erro ao buscar logs de auditoria" },
      { status: 500 }
    );
  }
}
