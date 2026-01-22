import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import {
  getUserOrganizations,
  getOrganizationDashboardStats,
  getOrganizationNutrisWithSchedule,
} from "@/lib/queries/organization";
import { OrgMetrics } from "./_components/org-metrics";
import { NutriScheduleCard } from "./_components/nutri-schedule-card";

export default async function OrganizationDashboardPage() {
  const organizations = await getUserOrganizations();

  if (organizations.length === 0) {
    redirect("/organization");
  }

  const org = organizations[0];

  const [stats, nutris] = await Promise.all([
    getOrganizationDashboardStats(org.id),
    getOrganizationNutrisWithSchedule(org.id),
  ]);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard - {org.name}</h1>
        <p className="text-muted-foreground capitalize">{today}</p>
      </div>

      <OrgMetrics stats={stats} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Nutricionistas Ativos</CardTitle>
            <CardDescription>
              Visão geral da agenda de hoje de cada nutricionista da clínica.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/organization/schedule">
              <Calendar className="mr-2 h-4 w-4" />
              Ver Agenda Completa
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {nutris.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum nutricionista ativo na clínica. Convide membros para começar.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nutris.map((nutri) => (
                <NutriScheduleCard key={nutri.id} nutri={nutri} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
