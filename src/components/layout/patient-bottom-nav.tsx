"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Home, User, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Início",
    href: "/patient",
    icon: Home,
  },
  {
    title: "Plano",
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

interface PatientBottomNavProps {
  children: React.ReactNode;
}

export function PatientBottomNav({ children }: PatientBottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-center border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <span className="font-semibold">NutriFlow</span>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background safe-area-inset-bottom">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/patient"
                ? pathname === "/patient"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2",
                  "text-muted-foreground transition-colors",
                  isActive && "text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
