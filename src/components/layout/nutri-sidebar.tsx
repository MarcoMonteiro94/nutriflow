"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChefHat,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { OrgRole } from "@/types/database";

// Navigation items by role
const navItemsByRole: Record<OrgRole, Array<{ title: string; href: string; icon: typeof LayoutDashboard }>> = {
  admin: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Pacientes", href: "/patients", icon: Users },
    { title: "Planos", href: "/plans", icon: UtensilsCrossed },
    { title: "Desafios", href: "/challenges", icon: Trophy },
    { title: "Agenda", href: "/schedule", icon: CalendarDays },
    { title: "Alimentos", href: "/foods", icon: ChefHat },
  ],
  nutri: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Pacientes", href: "/patients", icon: Users },
    { title: "Planos", href: "/plans", icon: UtensilsCrossed },
    { title: "Desafios", href: "/challenges", icon: Trophy },
    { title: "Agenda", href: "/schedule", icon: CalendarDays },
    { title: "Alimentos", href: "/foods", icon: ChefHat },
  ],
  receptionist: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Pacientes", href: "/patients", icon: Users },
    { title: "Agenda", href: "/schedule", icon: CalendarDays },
  ],
  patient: [
    { title: "Meu Painel", href: "/patient/dashboard", icon: LayoutDashboard },
  ],
};

const secondaryNavItemsByRole: Record<OrgRole, Array<{ title: string; href: string; icon: typeof Building2 }>> = {
  admin: [
    { title: "Minha Clínica", href: "/organization", icon: Building2 },
    { title: "Configurações", href: "/settings", icon: Settings },
  ],
  nutri: [
    { title: "Configurações", href: "/settings", icon: Settings },
  ],
  receptionist: [
    { title: "Configurações", href: "/settings", icon: Settings },
  ],
  patient: [
    { title: "Configurações", href: "/settings", icon: Settings },
  ],
};

const roleLabels: Record<OrgRole, string> = {
  admin: "Administrador",
  nutri: "Nutricionista",
  receptionist: "Recepcionista",
  patient: "Paciente",
};

interface NutriSidebarProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  role?: OrgRole | null;
  isOwner?: boolean;
}

export function NutriSidebar({ children, user, role, isOwner }: NutriSidebarProps) {
  const pathname = usePathname();

  // Get nav items based on role, default to nutri for backwards compatibility
  const effectiveRole = role || "nutri";
  const mainNavItems = navItemsByRole[effectiveRole] || navItemsByRole.nutri;
  const secondaryNavItems = secondaryNavItemsByRole[effectiveRole] || secondaryNavItemsByRole.nutri;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-foreground">NutriFlow</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator className="my-2" />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || "N"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user?.name || "Usuário"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email || "email@exemplo.com"}
                  </span>
                </div>
              </div>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-xl",
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    "transition-all hover:shadow-soft"
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sair</span>
                </button>
              </form>
            </div>
            {role && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {roleLabels[effectiveRole]}
                </Badge>
                {isOwner && (
                  <Badge variant="outline" className="text-xs">
                    Proprietário
                  </Badge>
                )}
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <SidebarTrigger className="lg:hidden" />
          <div className="flex-1" />
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
