import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyPatientToken } from "@/lib/patient-token";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LogIn, UserPlus } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

async function getPatientInfo(patientId: string) {
  // Use service client to bypass RLS - patient is not authenticated yet
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("patients")
    .select("full_name, email, user_id")
    .eq("id", patientId)
    .single();

  return data;
}

export default async function AccessChoosePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect("/patient?error=missing_token");
  }

  // Verify token
  const result = await verifyPatientToken(token);

  if (!result.valid || !result.patientId) {
    redirect("/patient?error=invalid_token");
  }

  // Get patient info
  const patient = await getPatientInfo(result.patientId);

  if (!patient) {
    redirect("/patient?error=invalid_token");
  }

  // Build URLs with properly encoded redirect
  const redirectUrl = `/patient/access/link?token=${token}`;
  const signupUrl = `/auth/login?mode=signup&redirect=${encodeURIComponent(redirectUrl)}`;
  const loginUrl = `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">NutriFlow</h1>
        </div>

        {/* Welcome Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Olá, {patient.full_name?.split(" ")[0]}!</CardTitle>
            <CardDescription>
              Seu nutricionista compartilhou um plano alimentar com você.
              Crie uma conta ou entre para acessar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Option 1: Create Account */}
            <Button asChild variant="default" className="w-full h-auto py-4">
              <Link href={signupUrl}>
                <div className="flex items-center gap-3 w-full">
                  <UserPlus className="h-5 w-5 shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Criar conta</p>
                    <p className="text-xs font-normal opacity-80">
                      Primeira vez aqui? Cadastre-se
                    </p>
                  </div>
                </div>
              </Link>
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Option 2: Login */}
            <Button asChild variant="outline" className="w-full h-auto py-4">
              <Link href={loginUrl}>
                <div className="flex items-center gap-3 w-full">
                  <LogIn className="h-5 w-5 shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Já tenho conta</p>
                    <p className="text-xs font-normal text-muted-foreground">
                      Entrar com minha conta existente
                    </p>
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Info text */}
        <p className="text-center text-xs text-muted-foreground px-4">
          Com sua conta, você poderá acessar seu plano de qualquer dispositivo
          e acompanhar seu progresso ao longo do tempo.
        </p>
      </div>
    </div>
  );
}
