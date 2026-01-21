import { redirect } from "next/navigation";
import { NutriSidebar } from "@/components/layout/nutri-sidebar";
import { createClient } from "@/lib/supabase/server";

type ProfileData = {
  full_name: string;
  email: string;
} | null;

export default async function NutriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense-in-depth: redirect if not authenticated
  if (!user) {
    redirect("/auth/login");
  }

  // Get profile data for the sidebar
  let profile: ProfileData = null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();
  profile = data as ProfileData;

  return (
    <NutriSidebar
      user={
        profile
          ? {
              name: profile.full_name,
              email: profile.email,
            }
          : {
              name: user.user_metadata?.full_name || "Usuário",
              email: user.email || "",
            }
      }
    >
      {children}
    </NutriSidebar>
  );
}
