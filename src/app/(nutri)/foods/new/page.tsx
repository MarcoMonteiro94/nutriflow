import { redirect } from "next/navigation";
import { Apple, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getUserRole, isClinicalRole } from "@/lib/auth/authorization";
import { FoodForm } from "../_components/food-form";

export default async function NewFoodPage() {
  const userRole = await getUserRole();
  if (!userRole || !isClinicalRole(userRole.role)) {
    redirect("/schedule");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/foods">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo Alimento
          </h1>
          <p className="text-muted-foreground">
            Cadastre um alimento personalizado para seus planos alimentares.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-primary" />
            Informações do Alimento
          </CardTitle>
          <CardDescription>
            Preencha os dados nutricionais do alimento. Campos marcados com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FoodForm />
        </CardContent>
      </Card>
    </div>
  );
}
