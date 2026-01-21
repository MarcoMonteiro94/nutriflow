import { getPatientTokenCookie, getPatientPlanByToken } from "@/lib/patient-token";
import { PatientMealPlanView } from "./_components/patient-meal-plan-view";
import { UtensilsCrossed, Lock } from "lucide-react";
import Link from "next/link";

export default async function PatientPlanPage() {
  const token = await getPatientTokenCookie();

  // Not authenticated - show message to request link
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Acesso Restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Para visualizar seu plano alimentar, você precisa de um link de acesso
          do seu nutricionista.
        </p>
        <Link
          href="/patient"
          className="mt-4 text-sm text-primary hover:underline"
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  // Get plan data using RPC function (bypasses RLS)
  const result = await getPatientPlanByToken(token);

  if (result.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">Erro ao carregar</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          {result.error}
        </p>
        <Link
          href="/patient"
          className="mt-4 text-sm text-primary hover:underline"
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  const plan = result.plan;

  // No active plan found
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Nenhum plano ativo</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Seu nutricionista ainda não criou um plano alimentar para você, ou seu
          plano anterior foi arquivado.
        </p>
      </div>
    );
  }

  // Transform data for the view component
  const meals = plan.meals.map((meal) => {
    const primaryFoods = meal.meal_contents.filter((c) => !c.is_substitution);
    const foods = primaryFoods.map((content) => {
      const substitutions = meal.meal_contents
        .filter(
          (c) => c.is_substitution && c.parent_content_id === content.id
        )
        .map((sub) => ({
          id: sub.id,
          name: sub.food_item?.name ?? "Alimento",
          amount: sub.amount,
          calories: sub.food_item
            ? Math.round((sub.amount / 100) * sub.food_item.calories)
            : 0,
        }));

      return {
        id: content.id,
        name: content.food_item?.name ?? "Alimento",
        amount: content.amount,
        calories: content.food_item
          ? Math.round((content.amount / 100) * content.food_item.calories)
          : 0,
        substitutions,
      };
    });

    return {
      id: meal.id,
      title: meal.title,
      time: meal.time.slice(0, 5), // Format HH:mm
      foods,
    };
  });

  return (
    <PatientMealPlanView
      planTitle={plan.title ?? "Plano Alimentar"}
      meals={meals}
    />
  );
}
