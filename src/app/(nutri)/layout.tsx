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

  // Get profile data for the sidebar
  let profile: ProfileData = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();
    profile = data as ProfileData;
  }

  return (
    <NutriSidebar
      user={
        profile
          ? {
              name: profile.full_name,
              email: profile.email,
            }
          : undefined
      }
    >
      {children}
    </NutriSidebar>
  );
}
