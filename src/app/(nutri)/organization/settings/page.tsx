import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserOrganizations, isUserOrgAdmin } from "@/lib/queries/organization";
import { OrganizationForm } from "../_components/organization-form";
import { DangerZone } from "./_components/danger-zone";

export default async function OrganizationSettingsPage() {
  const organizations = await getUserOrganizations();

  if (organizations.length === 0) {
    redirect("/organization");
  }

  const org = organizations[0];
  const isAdmin = await isUserOrgAdmin(org.id);

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações da Clínica</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para editar as configurações da clínica.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações da Clínica</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações e dados da sua clínica.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>
            Atualize os dados básicos da sua clínica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationForm organization={org} />
        </CardContent>
      </Card>

      <DangerZone organizationId={org.id} organizationName={org.name} />
    </div>
  );
}
