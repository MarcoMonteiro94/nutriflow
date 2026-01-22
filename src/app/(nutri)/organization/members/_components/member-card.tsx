"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {MoreVertical, Shield, User, UserMinus, UserX} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import type {OrgRole} from "@/types/database";

interface MemberWithProfile {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  status: "pending" | "active" | "inactive";
  profiles: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface MemberCardProps {
  member: MemberWithProfile;
  isOwner: boolean;
  isCurrentUser: boolean;
  canManage: boolean;
}

const roleLabels: Record<OrgRole, string> = {
  admin: "Administrador",
  nutri: "Nutricionista",
  receptionist: "Recepcionista",
  patient: "Paciente",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-200",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  inactive: "bg-gray-500/10 text-gray-600 border-gray-200",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  inactive: "Inativo",
};

export function MemberCard({
  member,
  isOwner,
  isCurrentUser,
  canManage,
}: MemberCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  async function handleRoleChange(newRole: OrgRole) {
    setIsLoading(true);
    const supabase = createClient();
    await supabase
      .from("organization_members")
      .update({role: newRole})
      .eq("id", member.id);
    setIsLoading(false);
    router.refresh();
  }

  async function handleStatusToggle() {
    setIsLoading(true);
    const supabase = createClient();
    const newStatus = member.status === "active" ? "inactive" : "active";
    await supabase
      .from("organization_members")
      .update({status: newStatus})
      .eq("id", member.id);
    setIsLoading(false);
    router.refresh();
  }

  async function handleRemove() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.from("organization_members").delete().eq("id", member.id);
    setIsLoading(false);
    setShowRemoveDialog(false);
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {member.profiles?.full_name || "Usuário"}
                </span>
                {isOwner && (
                  <Badge variant="outline" className="text-xs">
                    Proprietário
                  </Badge>
                )}
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    Você
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {member.profiles?.email || "Email não disponível"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className={statusColors[member.status]}>
              {statusLabels[member.status]}
            </Badge>
            <Badge variant="secondary">{roleLabels[member.role]}</Badge>

            {canManage && !isOwner && !isCurrentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isLoading}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRoleChange("admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Tornar Administrador
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange("nutri")}>
                    <User className="mr-2 h-4 w-4" />
                    Tornar Nutricionista
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRoleChange("receptionist")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Tornar Recepcionista
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleStatusToggle}>
                    {member.status === "active" ? (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{member.profiles?.full_name || "este membro"}</strong> da
              clínica? Esta ação pode ser desfeita convidando o membro
              novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
