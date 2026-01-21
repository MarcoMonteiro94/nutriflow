import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function PatientHomePage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  if (error === "missing_token") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <LinkIcon className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">Link inválido</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          O link de acesso não contém um token válido. Por favor, solicite um
          novo link ao seu nutricionista.
        </p>
      </div>
    );
  }

  if (error === "invalid_token") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <Clock className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">Link expirado ou inválido</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Este link de acesso expirou ou é inválido. Por favor, solicite um
          novo link ao seu nutricionista.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold">Área do Paciente</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        Para acessar seu plano alimentar, utilize o link enviado pelo seu
        nutricionista.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/patient/plan">
          Ver meu plano
        </Link>
      </Button>
    </div>
  );
}
