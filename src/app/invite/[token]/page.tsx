import { createClient } from "@/lib/supabase/server";
import { getInviteByToken } from "@/lib/queries/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OrgRole } from "@/types/database";
import { AutoAcceptInvite } from "./_components/auto-accept-invite";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  nutri: "Nutricionista",
  receptionist: "Recepcionista",
  patient: "Paciente",
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const result = await getInviteByToken(token);

  if (result.status === "not_found") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Convite Inválido</h3>
            <p className="text-muted-foreground mb-6">
              Este convite não existe ou já foi aceito.
            </p>
            <Link href="/auth/login">
              <Button variant="outline">Ir para Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result.status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10 mb-4">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Convite Expirado</h3>
            <p className="text-muted-foreground mb-6">
              Este convite expirou. Solicite um novo convite ao administrador da sua clínica.
            </p>
            <Link href="/auth/login">
              <Button variant="outline">Ir para Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invite = result.invite;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, show accept button
  // If not, show login/signup options
  const isLoggedIn = !!user;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Você foi convidado!</CardTitle>
          <CardDescription>
            Você foi convidado para se juntar à clínica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold">{invite.organization.name}</h3>
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-sm" data-testid="invite-role-badge">
                {roleLabels[invite.role]}
              </Badge>
            </div>
          </div>

          {isLoggedIn ? (
            user.email?.toLowerCase() === invite.email.toLowerCase() ? (
              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  Logado como <strong>{user.email}</strong>
                </p>
                <AutoAcceptInvite token={token} role={invite.role as OrgRole} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-amber-100 dark:bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-400 text-center">
                  <p>
                    Você está logado como <strong>{user.email}</strong>, mas este convite foi enviado para <strong>{invite.email}</strong>.
                  </p>
                  <p className="mt-2">
                    Faça logout e entre com o email correto para aceitar o convite.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Faça login ou crie uma conta para aceitar o convite.
              </p>
              <div className="flex flex-col gap-2">
                <Link href={`/auth/login?redirect=/invite/${token}&email=${encodeURIComponent(invite.email)}`}>
                  <Button className="w-full">Fazer Login</Button>
                </Link>
                <Link href={`/auth/login?mode=signup&redirect=/invite/${token}&email=${encodeURIComponent(invite.email)}&role=${invite.role}`}>
                  <Button variant="outline" className="w-full">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Este convite foi enviado para <strong>{invite.email}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
