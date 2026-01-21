"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChefHat,
  LayoutDashboard,
  LogOut,
  Settings,
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

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Pacientes",
    href: "/patients",
    icon: Users,
  },
  {
    title: "Planos",
    href: "/plans",
    icon: UtensilsCrossed,
  },
  {
    title: "Agenda",
    href: "/schedule",
    icon: CalendarDays,
  },
  {
    title: "Alimentos",
    href: "/foods",
    icon: ChefHat,
  },
];

const secondaryNavItems = [
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

interface NutriSidebarProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function NutriSidebar({ children, user }: NutriSidebarProps) {
  const pathname = usePathname();

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
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() || "N"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.name || "Nutricionista"}
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
