import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Settings, LayoutDashboard, Plus } from "lucide-react";
import Link from "next/link";
import { getUserOrganizations } from "@/lib/queries/organization";
import { Button } from "@/components/ui/button";

const orgMenuItems = [
  {
    title: "Dashboard",
    description: "Visão geral da clínica e agenda consolidada",
    icon: LayoutDashboard,
    href: "/organization/dashboard",
  },
  {
    title: "Membros",
    description: "Gerencie nutricionistas e recepcionistas",
    icon: Users,
    href: "/organization/members",
  },
  {
    title: "Configurações",
    description: "Configure os dados e preferências da clínica",
    icon: Settings,
    href: "/organization/settings",
  },
];

export default async function OrganizationPage() {
  const organizations = await getUserOrganizations();

  if (organizations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Minha Clínica</h1>
          <p className="text-muted-foreground">
            Gerencie sua clínica e equipe de nutricionistas.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma clínica encontrada</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Você ainda não faz parte de nenhuma clínica. Crie uma nova clínica para começar a gerenciar sua equipe.
            </p>
            <Link href="/organization/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Clínica
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For now, just use the first organization
  const org = organizations[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
          <p className="text-muted-foreground">
            Gerencie sua clínica e equipe de nutricionistas.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {orgMenuItems.map((item) => (
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
