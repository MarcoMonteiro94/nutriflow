import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, Calendar, Mail } from "lucide-react";
import type { OrgDashboardStats } from "@/lib/queries/organization";

interface OrgMetricsProps {
  stats: OrgDashboardStats;
}

const metrics = [
  {
    key: "totalMembers" as const,
    label: "Total de Membros",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    key: "activeMembers" as const,
    label: "Membros Ativos",
    icon: UserCheck,
    color: "bg-green-500/10 text-green-600",
  },
  {
    key: "totalAppointmentsToday" as const,
    label: "Consultas Hoje",
    icon: Calendar,
    color: "bg-primary/10 text-primary",
  },
  {
    key: "pendingInvites" as const,
    label: "Convites Pendentes",
    icon: Mail,
    color: "bg-yellow-500/10 text-yellow-600",
  },
];

export function OrgMetrics({ stats }: OrgMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.key}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${metric.color}`}>
              <metric.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats[metric.key]}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
