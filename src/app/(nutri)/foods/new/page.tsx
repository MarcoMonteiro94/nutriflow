import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FoodForm } from "../_components/food-form";

export default function NewFoodPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo Alimento</h1>
        <p className="text-muted-foreground">
          Cadastre um novo alimento personalizado para usar nos planos alimentares.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Alimento</CardTitle>
          <CardDescription>
            Preencha os dados nutricionais do alimento. Campos com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FoodForm />
        </CardContent>
      </Card>
    </div>
  );
}
