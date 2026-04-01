"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

  // Check if user has an organization to avoid double redirect
  // (login → /dashboard → layout redirect → /organization/create causes RSC loop)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!membership) {
      // Check if user owns any organization
      const { data: ownedOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .single();

      if (!ownedOrg) {
        const userType = user.user_metadata?.user_type;
        if (userType === "patient") {
          redirect("/patient/dashboard");
        }
        // For invite users and nutris without org, go to org create
        // (invite users will be redirected to /invite/[token] by the layout)
        redirect("/organization/create");
      }
    }
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

  // Invite-only guard: verify email has a pending invite
  const serviceClient = createServiceClient();
  const { data: pendingInvite } = await serviceClient
    .from("organization_invites")
    .select("id, token")
    .eq("email", email.toLowerCase())
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .single();

  if (!pendingInvite) {
    return { error: "Cadastro disponível apenas por convite. Solicite um convite ao administrador da sua clínica." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        user_type: "invite",
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

  // Check if email confirmation is required (user exists but session is null)
  if (!data.session) {
    return {
      success: true,
      error: undefined
    };
  }

  revalidatePath("/", "layout");

  // Redirect to the invite page for auto-accept
  redirect(`/invite/${pendingInvite.token}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
