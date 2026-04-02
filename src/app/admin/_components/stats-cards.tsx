import {
  Building2,
  Mail,
  Users,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformStats } from "@/types/admin";

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
}

function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  stats: PlatformStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Clínicas"
        value={stats.totalOrganizations}
        subtitle={`${stats.activeOrganizations} ativas`}
        icon={Building2}
      />
      <StatCard
        title="Usuários"
        value={stats.totalUsers}
        subtitle={`${stats.usersByRole.nutri ?? 0} nutricionistas`}
        icon={Users}
      />
      <StatCard
        title="Pacientes"
        value={stats.totalPatients}
        icon={UserCheck}
      />
      <StatCard
        title="Convites Pendentes"
        value={stats.pendingInvites}
        icon={Mail}
      />
    </div>
  );
}
