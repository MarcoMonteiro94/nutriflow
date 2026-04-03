import { getPlatformStatsForPage } from "@/lib/queries/admin";
import { StatsCards } from "./_components/stats-cards";

export default async function AdminDashboardPage() {
  const stats = await getPlatformStatsForPage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma NutriFlow
        </p>
      </div>
      <StatsCards stats={stats} />
    </div>
  );
}
