import { OnboardingWizard } from "./_components/onboarding-wizard";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo Paciente</h1>
        <p className="text-muted-foreground">
          Cadastre um novo paciente e preencha as informações iniciais.
        </p>
      </div>

      <OnboardingWizard isReceptionist={isReceptionist} nutris={nutris} />
    </div>
  );
}
