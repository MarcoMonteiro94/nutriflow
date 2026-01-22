import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getUserOrganizations,
  getOrganizationMembers,
  getOrganizationInvites,
  isUserOrgAdmin,
} from "@/lib/queries/organization";
import { MemberCard } from "./_components/member-card";
import { InviteDialog } from "./_components/invite-dialog";
import { PendingInvites } from "./_components/pending-invites";
import { canInviteMembers } from "@/lib/auth/authorization";
import type { OrgRole } from "@/types/database";

export default async function OrganizationMembersPage() {
  const organizations = await getUserOrganizations();

  if (organizations.length === 0) {
    redirect("/organization");
  }

  const org = organizations[0];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [members, invites, canManage] = await Promise.all([
    getOrganizationMembers(org.id),
    getOrganizationInvites(org.id),
    isUserOrgAdmin(org.id),
  ]);

  // Get current user's role and check if owner
  const isOwner = org.owner_id === user?.id;
  const currentMember = members.find((m) => m.user_id === user?.id);
  const currentUserRole: OrgRole | null = isOwner
    ? "admin"
    : (currentMember?.role as OrgRole | null) ?? null;

  // Check if user can invite
  const userCanInvite = canInviteMembers(currentUserRole, isOwner);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Membros</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da {org.name}.
          </p>
        </div>
        {userCanInvite && (
          <InviteDialog
            organizationId={org.id}
            currentUserRole={currentUserRole}
            isOwner={isOwner}
          />
        )}
      </div>

      <PendingInvites invites={invites} />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">
          Membros Ativos ({members.filter((m) => m.status === "active").length})
        </h2>
        {members
          .filter((m) => m.status === "active")
          .map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isOwner={member.user_id === org.owner_id}
              isCurrentUser={member.user_id === user?.id}
              canManage={canManage}
            />
          ))}
      </div>

      {members.filter((m) => m.status === "inactive").length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-muted-foreground">
            Membros Inativos ({members.filter((m) => m.status === "inactive").length})
          </h2>
          {members
            .filter((m) => m.status === "inactive")
            .map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isOwner={member.user_id === org.owner_id}
                isCurrentUser={member.user_id === user?.id}
                canManage={canManage}
              />
            ))}
        </div>
      )}

      {members.filter((m) => m.status === "pending").length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-muted-foreground">
            Aguardando Aceitação ({members.filter((m) => m.status === "pending").length})
          </h2>
          {members
            .filter((m) => m.status === "pending")
            .map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isOwner={member.user_id === org.owner_id}
                isCurrentUser={member.user_id === user?.id}
                canManage={canManage}
              />
            ))}
        </div>
      )}
    </div>
  );
}
