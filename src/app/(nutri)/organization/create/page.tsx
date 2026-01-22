import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationForm } from "../_components/organization-form";

export default function CreateOrganizationPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Criar Clínica</h1>
        <p className="text-muted-foreground">
          Crie uma clínica para gerenciar múltiplos nutricionistas em um só lugar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Clínica</CardTitle>
          <CardDescription>
            Configure os dados básicos da sua clínica. Você poderá convidar outros nutricionistas depois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
