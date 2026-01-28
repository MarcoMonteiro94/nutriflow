"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  UtensilsCrossed,
  Home,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const publicNavItems = [
  {
    title: "Início",
    href: "/patient",
    icon: Home,
  },
  {
    title: "Meu Plano",
    href: "/patient/plan",
    icon: UtensilsCrossed,
  },
  {
    title: "Progresso",
    href: "/patient/progress",
    icon: Activity,
  },
  {
    title: "Perfil",
    href: "/patient/profile",
    icon: User,
  },
];

const authenticatedNavItems = [
  {
    title: "Painel",
    href: "/patient/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Meu Plano",
    href: "/patient/plan",
    icon: UtensilsCrossed,
  },
  {
    title: "Progresso",
    href: "/patient/progress",
    icon: Activity,
  },
  {
    title: "Perfil",
    href: "/patient/profile",
    icon: User,
  },
  {
    title: "Configurações",
    href: "/patient/settings",
    icon: Settings,
  },
];

interface PatientLayoutProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
}

export function PatientLayout({ children, isAuthenticated }: PatientLayoutProps) {
  const pathname = usePathname();
  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  const isActive = (href: string) => {
    if (href === "/patient" || href === "/patient/dashboard") {
      return pathname === "/patient" || pathname === "/patient/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-svh bg-gradient-to-br from-background via-background to-primary/[0.02]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card/80 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold tracking-tight">NutriFlow</span>
              <p className="text-[10px] text-muted-foreground">Portal do Paciente</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                    isActive(item.href) && "text-primary"
                  )}
                />
                {item.title}
                {isActive(item.href) && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          {isAuthenticated && (
            <div className="border-t p-4">
              <form action="/auth/logout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da conta
                </Button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-semibold">NutriFlow</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sair</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="min-h-[calc(100svh-3.5rem)] pb-20 lg:min-h-svh lg:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur-xl lg:hidden safe-area-inset-bottom">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors",
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "relative rounded-xl p-1.5 transition-all duration-200",
                  isActive(item.href) && "bg-primary/10"
                )}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{item.title}</span>
              {isActive(item.href) && (
                <div className="absolute -bottom-1 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
