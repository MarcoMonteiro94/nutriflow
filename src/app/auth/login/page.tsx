"use client";

import { useActionState, useState } from "react";
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

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(
    login,
    initialState
  );
  const [signupState, signupAction, signupPending] = useActionState(
    signup,
    initialState
  );

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
            ? "Crie sua conta para começar"
            : "Entre com seu email para acessar"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              {state.error}
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

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="font-medium text-primary hover:text-primary/80 transition-colors"
            disabled={isPending}
          >
            {isSignup ? "Entrar" : "Criar conta"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
