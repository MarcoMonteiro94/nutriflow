"use client";

import { Suspense, useActionState, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup, type AuthState } from "../actions";

const initialState: AuthState = {};

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";
  // Signup mode is ONLY available via invite link (mode=signup parameter)
  const inviteMode = searchParams.get("mode") === "signup";
  const [isSignup, setIsSignup] = useState(inviteMode);

  const [loginState, loginAction, loginPending] = useActionState(
    login,
    initialState
  );
  const [signupState, signupAction, signupPending] = useActionState(
    signup,
    initialState
  );

  // If mode changes (e.g., user navigates), update signup state
  useEffect(() => {
    setIsSignup(inviteMode);
  }, [inviteMode]);

  const state = isSignup ? signupState : loginState;
  const action = isSignup ? signupAction : loginAction;
  const isPending = isSignup ? signupPending : loginPending;

  return (
    <Card className="w-full max-w-md shadow-soft-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <UtensilsCrossed className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold">NutriFlow</CardTitle>
        <CardDescription>
          {isSignup
            ? "Crie sua conta para aceitar o convite"
            : "Entre com seu email para acessar"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {/* Hidden field for redirect */}
          {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

          {state.error && (
            <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {state.success && (
            <div className="rounded-xl bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400">
              Conta criada com sucesso! Verifique seu email para confirmar o cadastro.
            </div>
          )}

          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Seu nome"
                required
                disabled={isPending}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? isSignup
                ? "Criando conta..."
                : "Entrando..."
              : isSignup
                ? "Criar Conta"
                : "Entrar"}
          </Button>
        </form>

        {/* Only show toggle if user came from invite link */}
        {inviteMode && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className="font-medium text-primary hover:text-primary/80 transition-colors"
              disabled={isPending}
            >
              Entrar
            </button>
          </div>
        )}

        {/* Show message for non-invite users */}
        {!inviteMode && !isSignup && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Não tem uma conta? Solicite um convite ao administrador da sua clínica.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-md shadow-soft-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <UtensilsCrossed className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold">NutriFlow</CardTitle>
        <CardDescription>Carregando...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
