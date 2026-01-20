import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientHomePage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Olá!</h1>
        <p className="text-sm text-muted-foreground">
          Confira seu plano alimentar de hoje.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Próxima Refeição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum plano alimentar encontrado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
