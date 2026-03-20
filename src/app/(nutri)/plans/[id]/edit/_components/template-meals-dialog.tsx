"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2, UtensilsCrossed } from "lucide-react";

interface Template {
  id: string;
  title: string;
  time: string | null;
  created_at: string;
  contentCount: number;
}

interface TemplateContent {
  id: string;
  food_id: string;
  amount: number;
  is_substitution: boolean;
  parent_content_id: string | null;
}

interface TemplateMealsDialogProps {
  planId: string;
  children: React.ReactNode;
}

// Helper to access new tables not yet in generated Supabase types.
// After running `supabase gen types` post-migration, remove these casts.
function fromTable(supabase: ReturnType<typeof createClient>, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

export function TemplateMealsDialog({ planId, children }: TemplateMealsDialogProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function fetchTemplates() {
      const supabase = createClient();

      const { data } = await fromTable(supabase, "meal_templates")
        .select("id, title, time, created_at, meal_template_contents(id)")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      const templatesData = (data ?? []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        title: t.title as string,
        time: t.time as string | null,
        created_at: t.created_at as string,
        contentCount: (t.meal_template_contents as { id: string }[])?.length ?? 0,
      }));

      setTemplates(templatesData);
      setIsLoading(false);
    }

    fetchTemplates();

    return () => { cancelled = true; };
  }, [open]);

  function handleUseTemplate(template: Template) {
    startTransition(async () => {
      const supabase = createClient();

      // Fetch template contents
      const { data: contents } = await fromTable(supabase, "meal_template_contents")
        .select("id, food_id, amount, is_substitution, parent_content_id")
        .eq("template_id", template.id);

      if (!contents) return;
      const rows = contents as TemplateContent[];

      // Create new meal
      const { data: newMeal } = await supabase
        .from("meals")
        .insert({
          meal_plan_id: planId,
          title: template.title,
          time: template.time ?? "12:00",
          sort_order: 0,
        })
        .select("id")
        .single();

      if (!newMeal) return;

      // Insert main foods first, build old→new ID map
      const mainFoods = rows.filter((c) => !c.is_substitution);
      const idMap = new Map<string, string>();

      for (const food of mainFoods) {
        const { data: newContent } = await supabase
          .from("meal_contents")
          .insert({
            meal_id: newMeal.id,
            food_id: food.food_id,
            amount: food.amount,
            is_substitution: false,
          })
          .select("id")
          .single();

        if (newContent) {
          idMap.set(food.id, newContent.id);
        }
      }

      // Insert substitutions with mapped parent_content_id
      const substitutions = rows.filter((c) => c.is_substitution && c.parent_content_id);
      for (const sub of substitutions) {
        const newParentId = idMap.get(sub.parent_content_id!);
        if (!newParentId) continue;

        await supabase
          .from("meal_contents")
          .insert({
            meal_id: newMeal.id,
            food_id: sub.food_id,
            amount: sub.amount,
            is_substitution: true,
            parent_content_id: newParentId,
          });
      }

      router.refresh();
      setOpen(false);
    });
  }

  function handleDeleteTemplate(templateId: string) {
    startTransition(async () => {
      const supabase = createClient();
      await fromTable(supabase, "meal_templates").delete().eq("id", templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modelos de Refeição</DialogTitle>
          <DialogDescription>
            Selecione um modelo salvo para adicionar ao plano.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum modelo salvo.</p>
              <p className="mt-1 text-xs">
                Salve uma refeição como modelo usando o botão de bookmark na lista de refeições.
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 text-left"
                  disabled={isPending}
                >
                  <p className="font-medium text-sm">{template.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {template.time?.slice(0, 5) ?? "—"} &bull; {template.contentCount} alimento{template.contentCount !== 1 ? "s" : ""}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDeleteTemplate(template.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility function to save a meal as a template (used by MealTimeline)
export async function saveMealAsTemplate(meal: {
  title: string;
  time: string;
  meal_contents: {
    id: string;
    food_id: string;
    amount: number;
    is_substitution: boolean;
    parent_content_id: string | null;
  }[];
}): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Create template
  const { data: template } = await fromTable(supabase, "meal_templates")
    .insert({
      nutri_id: user.id,
      title: meal.title,
      time: meal.time,
    })
    .select("id")
    .single();

  if (!template) return false;
  const templateId = (template as { id: string }).id;

  // Insert main contents first, build ID map
  const mainFoods = meal.meal_contents.filter((c) => !c.is_substitution);
  const idMap = new Map<string, string>();

  for (const food of mainFoods) {
    const { data: newContent } = await fromTable(supabase, "meal_template_contents")
      .insert({
        template_id: templateId,
        food_id: food.food_id,
        amount: food.amount,
        is_substitution: false,
      })
      .select("id")
      .single();

    if (newContent) {
      idMap.set(food.id, (newContent as { id: string }).id);
    }
  }

  // Insert substitutions
  const substitutions = meal.meal_contents.filter((c) => c.is_substitution && c.parent_content_id);
  for (const sub of substitutions) {
    const newParentId = idMap.get(sub.parent_content_id!);
    if (!newParentId) continue;

    await fromTable(supabase, "meal_template_contents")
      .insert({
        template_id: templateId,
        food_id: sub.food_id,
        amount: sub.amount,
        is_substitution: true,
        parent_content_id: newParentId,
      });
  }

  return true;
}
