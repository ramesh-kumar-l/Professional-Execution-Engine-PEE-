import { auth } from '@/auth';
import { InviteMemberForm } from '@/components/InviteMemberForm';
import { listMembers } from '@/lib/organizations-api-client';
import { inviteMemberAction, removeMemberAction, updateMemberRoleAction } from '../../actions';

export default async function OrganizationMembersPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const organizationId = params.id;
  const members = session?.accessToken ? await listMembers(session.accessToken, organizationId) : [];
  const callerOrg = session?.user.organizations?.find((org) => org.id === organizationId);
  const canManage = callerOrg?.role === 'ADMIN' || callerOrg?.role === 'OWNER';

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Members</h1>
      <ul className="flex flex-col gap-3">
        {members.map((member) => {
          const nextRole = member.role === 'MEMBER' ? 'ADMIN' : 'MEMBER';
          return (
            <li key={member.userId} className="flex items-center gap-3">
              <span>
                {member.displayName} ({member.email}) — {member.role}
              </span>
              {canManage && member.role !== 'OWNER' && (
                <form action={updateMemberRoleAction.bind(null, organizationId, member.userId, nextRole)}>
                  <button type="submit">{member.role === 'MEMBER' ? 'Promote to Admin' : 'Demote to Member'}</button>
                </form>
              )}
              {canManage && (
                <form action={removeMemberAction.bind(null, organizationId, member.userId)}>
                  <button type="submit">Remove</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
      {canManage && (
        <>
          <h2 className="text-xl font-semibold">Invite a member</h2>
          <InviteMemberForm action={inviteMemberAction.bind(null, organizationId)} />
        </>
      )}
    </main>
  );
}
