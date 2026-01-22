"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email ou senha incorretos" };
  }

  revalidatePath("/", "layout");

  // Handle redirect if provided
  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  redirect("/dashboard");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !password || !fullName) {
    return { error: "Todos os campos são obrigatórios" };
  }

  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    console.error("Signup error:", error.message, error);
    if (error.message.includes("already registered")) {
      return { error: "Este email já está cadastrado" };
    }
    if (error.message.includes("valid email")) {
      return { error: "Por favor, insira um email válido" };
    }
    if (error.message.includes("password")) {
      return { error: "A senha deve ter pelo menos 6 caracteres" };
    }
    return { error: `Erro ao criar conta: ${error.message}` };
  }

  // Check if email confirmation is required
  if (data.user?.identities?.length === 0) {
    return { error: "Este email já está cadastrado" };
  }

  if (!data.user) {
    console.error("Signup returned no user");
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  // Profile is created automatically by database trigger (handle_new_user)
  // No need to manually insert here

  // Check if email confirmation is required (user exists but session is null)
  if (!data.session) {
    // Email confirmation is required - don't redirect, show success message
    return {
      success: true,
      error: undefined
    };
  }

  const redirectTo = formData.get("redirect") as string;
  revalidatePath("/", "layout");

  // Handle redirect if provided
  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
