import { requireSuperAdmin } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRole = await requireSuperAdmin();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userRole.userId)
    .single();

  return (
    <AdminSidebar
      user={{
        name: profile?.full_name ?? "Super Admin",
        email: profile?.email ?? "",
      }}
    >
      {children}
    </AdminSidebar>
  );
}
