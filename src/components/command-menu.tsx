"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Users,
  UtensilsCrossed,
  Calendar,
  LayoutDashboard,
  Settings,
  Apple,
  FileText,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CommandMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  // Register Cmd+K keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, setIsOpen]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      setIsOpen(false);
      command();
    },
    [setIsOpen]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          shouldFilter={true}
        >
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar pacientes, alimentos, planos..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </Command.Empty>

            <Command.Group heading="Navegação">
              <CommandItem
                onSelect={() => runCommand(() => router.push("/dashboard"))}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/patients"))}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Pacientes</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/plans"))}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>Planos Alimentares</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/schedule"))}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Agenda</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/foods"))}
              >
                <Apple className="mr-2 h-4 w-4" />
                <span>Alimentos</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/settings"))}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </CommandItem>
            </Command.Group>

            <Command.Group heading="Ações Rápidas">
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push("/patients/new"))
                }
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Novo Paciente</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/plans/new"))}
              >
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                <span>Novo Plano Alimentar</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
            </Command.Group>

            {/* Placeholder for dynamic patient/food search results */}
            {search && (
              <Command.Group heading="Pacientes">
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push("/patients/search?q=" + search))
                  }
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>Buscar &quot;{search}&quot; em pacientes</span>
                </CommandItem>
              </Command.Group>
            )}

            {search && (
              <Command.Group heading="Alimentos">
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push("/foods/search?q=" + search))
                  }
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>Buscar &quot;{search}&quot; em alimentos</span>
                </CommandItem>
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

interface CommandItemProps
  extends React.ComponentPropsWithoutRef<typeof Command.Item> {
  children: React.ReactNode;
}

function CommandItem({ children, className, ...props }: CommandItemProps) {
  return (
    <Command.Item
      className={cn(
        "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
    </Command.Item>
  );
}

function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export { CommandItem, CommandShortcut };
