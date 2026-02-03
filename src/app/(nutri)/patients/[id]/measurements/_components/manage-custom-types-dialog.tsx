"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CustomMeasurementType } from "@/types/database";

export function ManageCustomTypesDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customTypes, setCustomTypes] = useState<CustomMeasurementType[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<string>("");

  const categories = [
    { value: "body_composition", label: "Composição Corporal" },
    { value: "laboratory", label: "Exames Laboratoriais" },
    { value: "vital_signs", label: "Sinais Vitais" },
    { value: "other", label: "Outros" },
  ];

  const loadCustomTypes = useCallback(async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    const { data, error: fetchError } = await (supabase as any)
      .from("custom_measurement_types")
      .select("*")
      .eq("nutri_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setCustomTypes((data ?? []) as CustomMeasurementType[]);
  }, []);

  useEffect(() => {
    if (open) {
      loadCustomTypes();
    }
  }, [open, loadCustomTypes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name.trim()) {
      setError("O nome é obrigatório");
      setIsLoading(false);
      return;
    }

    if (!unit.trim()) {
      setError("A unidade é obrigatória");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado");
      setIsLoading(false);
      return;
    }

    // Check if type with same name already exists for this nutri
    const { data: existingType } = await (supabase as any)
      .from("custom_measurement_types")
      .select("id")
      .eq("nutri_id", user.id)
      .eq("name", name.trim())
      .single();

    if (existingType) {
      setError("Já existe um tipo de medida com este nome");
      setIsLoading(false);
      return;
    }

    const { error: createError } = await (supabase as any)
      .from("custom_measurement_types")
      .insert({
        nutri_id: user.id,
        name: name.trim(),
        unit: unit.trim(),
        category: category || null,
      });

    if (createError) {
      setError(createError.message);
      setIsLoading(false);
      return;
    }

    setName("");
    setUnit("");
    setCategory("");
    setIsLoading(false);
    await loadCustomTypes();
    router.refresh();
  }

  async function handleDelete(typeId: string) {
    if (!confirm("Tem certeza que deseja excluir este tipo de medida? Todos os valores associados também serão excluídos.")) {
      return;
    }

    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    // First delete all values associated with this type
    const { error: deleteValuesError } = await (supabase as any)
      .from("custom_measurement_values")
      .delete()
      .eq("type_id", typeId);

    if (deleteValuesError) {
      setError(deleteValuesError.message);
      return;
    }

    // Then delete the type itself
    const { error: deleteError } = await (supabase as any)
      .from("custom_measurement_types")
      .delete()
      .eq("id", typeId)
      .eq("nutri_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadCustomTypes();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Gerenciar Tipos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Tipos de Medidas Personalizadas</DialogTitle>
          <DialogDescription>
            Adicione tipos de medidas personalizadas (ex: colesterol, glicemia) ou remova tipos existentes.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* List of existing custom types */}
        {customTypes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tipos Existentes</h3>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
              {customTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between rounded-md bg-muted/50 p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{type.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Unidade: {type.unit}
                      {type.category && ` • ${categories.find((c) => c.value === type.category)?.label || type.category}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(type.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form to add new type */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-medium">Adicionar Novo Tipo</h3>

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Medida *</Label>
            <Input
              id="name"
              placeholder="Ex: Colesterol Total"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Input
              id="unit"
              placeholder="Ex: mg/dL"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Fechar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adicionando..." : "Adicionar Tipo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
