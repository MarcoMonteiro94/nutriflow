import type { Meal, MealContent, FoodItem } from "@/types/database";

// --- Age & Gender helpers ---

export function calculateAge(birthDate: string): number | null {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function mapGenderToSex(gender: string | null | undefined): "male" | "female" | null {
  if (!gender) return null;
  const g = gender.toLowerCase();
  if (g === "masculino" || g === "male" || g === "m") return "male";
  if (g === "feminino" || g === "female" || g === "f") return "female";
  return null;
}

// --- Activity Levels ---

export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentário", description: "Pouca ou nenhuma atividade física", factor: 1.2 },
  { value: "light", label: "Levemente ativo", description: "Exercício leve 1-3 dias/sem", factor: 1.375 },
  { value: "moderate", label: "Moderadamente ativo", description: "Exercício moderado 3-5 dias/sem", factor: 1.55 },
  { value: "active", label: "Ativo", description: "Exercício intenso 6-7 dias/sem", factor: 1.725 },
  { value: "very_active", label: "Muito ativo", description: "Exercício muito intenso ou trabalho físico", factor: 1.9 },
] as const;

export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]["value"];

// --- TMB / TDEE ---

/** Mifflin-St Jeor equation (recommended by Academy of Nutrition and Dietetics) */
export function calculateTMB(params: {
  weight: number; // kg
  height: number; // cm
  age: number;
  sex: "male" | "female";
}): number {
  const { weight, height, age, sex } = params;
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function calculateTDEE(tmb: number, activityLevel: ActivityLevel): number {
  const level = ACTIVITY_LEVELS.find((l) => l.value === activityLevel);
  return Math.round(tmb * (level?.factor ?? 1.2));
}

// --- Macro Targets ---

export type NutrientGoal = "maintenance" | "weight_loss" | "muscle_gain";

/**
 * Suggests macro targets based on TDEE and patient goal.
 * Returns grams for protein/carbs/fat based on standard distributions.
 */
export function suggestMacroTargets(
  tdee: number,
  goal: NutrientGoal = "maintenance"
): { calories: number; protein: number; carbs: number; fat: number } {
  let calories: number;
  let proteinPct: number;
  let carbsPct: number;
  let fatPct: number;

  switch (goal) {
    case "weight_loss":
      calories = Math.round(tdee * 0.8); // 20% deficit
      proteinPct = 0.35;
      carbsPct = 0.40;
      fatPct = 0.25;
      break;
    case "muscle_gain":
      calories = Math.round(tdee * 1.15); // 15% surplus
      proteinPct = 0.30;
      carbsPct = 0.50;
      fatPct = 0.20;
      break;
    default: // maintenance
      calories = tdee;
      proteinPct = 0.30;
      carbsPct = 0.45;
      fatPct = 0.25;
  }

  return {
    calories,
    protein: Math.round((calories * proteinPct) / 4), // 4 kcal/g
    carbs: Math.round((calories * carbsPct) / 4),     // 4 kcal/g
    fat: Math.round((calories * fatPct) / 9),          // 9 kcal/g
  };
}

/** Infer goal from patient.goal free-text field */
export function inferGoalFromText(goal: string | null | undefined): NutrientGoal {
  if (!goal) return "maintenance";
  const g = goal.toLowerCase();
  if (g.includes("emagrec") || g.includes("perda") || g.includes("peso") || g.includes("déficit")) {
    return "weight_loss";
  }
  if (g.includes("massa") || g.includes("ganho") || g.includes("hipertrofia") || g.includes("muscul")) {
    return "muscle_gain";
  }
  return "maintenance";
}

// --- Meal Totals ---

type MealWithContents = Meal & {
  meal_contents: (MealContent & {
    food_items: FoodItem | null;
  })[];
};

export function calculateSingleMealTotals(meal: MealWithContents): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const content of meal.meal_contents) {
    if (content.food_items && !content.is_substitution) {
      const factor = Number(content.amount) / 100;
      calories += Number(content.food_items.calories) * factor;
      protein += Number(content.food_items.protein) * factor;
      carbs += Number(content.food_items.carbs) * factor;
      fat += Number(content.food_items.fat) * factor;
    }
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

export function calculateMealTotals(meals: MealWithContents[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const meal of meals) {
    const mealTotals = calculateSingleMealTotals(meal);
    calories += mealTotals.calories;
    protein += mealTotals.protein;
    carbs += mealTotals.carbs;
    fat += mealTotals.fat;
  }

  return { calories, protein, carbs, fat };
}
