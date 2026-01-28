import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientForm } from "../_components/patient-form";
import { getUserRole } from "@/lib/auth/authorization";
import { getOrganizationNutris, type NutriOption } from "@/lib/queries/organization";

export default async function NewPatientPage() {
  const userRole = await getUserRole();
  const isReceptionist = userRole?.role === "receptionist";

  let nutris: NutriOption[] = [];
  if (isReceptionist) {
    nutris = await getOrganizationNutris();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo Paciente</h1>
        <p className="text-muted-foreground">
          Cadastre um novo paciente para iniciar o acompanhamento nutricional.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
          <CardDescription>
            Preencha os dados básicos do paciente. Campos com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm isReceptionist={isReceptionist} nutris={nutris} />
        </CardContent>
      </Card>
    </div>
  );
}
