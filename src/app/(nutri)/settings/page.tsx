import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Ban, User, Bell } from "lucide-react";
import Link from "next/link";

const settingsItems = [
  {
    title: "Disponibilidade",
    description: "Configure seus horários de atendimento semanais",
    icon: Clock,
    href: "/settings/availability",
  },
  {
    title: "Bloqueio de Horários",
    description: "Bloqueie dias ou períodos específicos (férias, feriados)",
    icon: Ban,
    href: "/settings/time-blocks",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações do sistema.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-all hover:shadow-soft-lg hover:border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
