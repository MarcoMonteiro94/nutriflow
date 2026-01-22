"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@/types/database";

interface OrganizationFormProps {
  organization?: Organization;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState(organization?.slug ?? "");

  const isEditing = !!organization;

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    if (!isEditing) {
      setSlug(generateSlug(name));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const name = formData.get("name") as string;
    const slugValue = formData.get("slug") as string;

    if (!name.trim()) {
      setError("O nome da clínica é obrigatório");
      setIsLoading(false);
      return;
    }

    if (!slugValue.trim()) {
      setError("O slug da clínica é obrigatório");
      setIsLoading(false);
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slugValue)) {
      setError("O slug deve conter apenas letras minúsculas, números e hífens");
      setIsLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado");
      setIsLoading(false);
      return;
    }

    if (isEditing) {
      // Check if slug is being changed and is available
      if (slugValue !== organization.slug) {
        const { data: existingOrg } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", slugValue)
          .neq("id", organization.id)
          .single();

        if (existingOrg) {
          setError("Este slug já está em uso");
          setIsLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ name, slug: slugValue })
        .eq("id", organization.id);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      router.push(`/organization/settings`);
    } else {
      // Check if slug is available
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slugValue)
        .single();

      if (existingOrg) {
        setError("Este slug já está em uso");
        setIsLoading(false);
        return;
      }

      const { data: newOrg, error: createError } = await supabase
        .from("organizations")
        .insert({ name, slug: slugValue, owner_id: user.id })
        .select("id")
        .single();

      if (createError || !newOrg) {
        setError(createError?.message ?? "Erro ao criar clínica");
        setIsLoading(false);
        return;
      }

      // Add owner as admin member automatically
      await supabase.from("organization_members").insert({
        organization_id: newOrg.id as string,
        user_id: user.id,
        role: "admin",
        status: "active",
        accepted_at: new Date().toISOString(),
      });

      router.push(`/organization/dashboard`);
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Clínica *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={organization?.name}
            placeholder="Ex: Clínica Nutri Vida"
            onChange={handleNameChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">URL da Clínica *</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              nutriflow.app/c/
            </span>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="nutri-vida"
              pattern="[a-z0-9-]+"
              title="Apenas letras minúsculas, números e hífens"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Esta será a URL pública da sua clínica. Use apenas letras minúsculas, números e hífens.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Salvando..."
            : isEditing
            ? "Salvar Alterações"
            : "Criar Clínica"}
        </Button>
      </div>
    </form>
  );
}
