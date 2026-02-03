import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Verify the requesting user is authenticated and is a nutri
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Check if user is a nutri
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as string | undefined;
    if (!role || (role !== "nutri" && role !== "admin")) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    // Use service role to search auth.users (bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Search for user by email in auth.users
    const { data: authUsers, error } = await serviceClient.auth.admin.listUsers({
      perPage: 1,
    });

    if (error) {
      console.error("Error searching users:", error);
      return NextResponse.json(
        { error: "Erro ao buscar usuários" },
        { status: 500 }
      );
    }

    // Find user with matching email
    const matchingUser = authUsers.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    // If not found in first page, do a more targeted search
    if (!matchingUser) {
      // Try to get user by email directly
      const { data: userData } = await serviceClient
        .from("profiles")
        .select("id, email:id")
        .or(`id.eq.${email}`)
        .single();

      // Alternative: Search through all users (limited approach)
      const { data: allUsers } = await serviceClient.auth.admin.listUsers({
        perPage: 1000,
      });

      const foundUser = allUsers?.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (foundUser) {
        return NextResponse.json({
          found: true,
          userId: foundUser.id,
          email: foundUser.email,
        });
      }

      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      userId: matchingUser.id,
      email: matchingUser.email,
    });
  } catch (error) {
    console.error("Search user error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
