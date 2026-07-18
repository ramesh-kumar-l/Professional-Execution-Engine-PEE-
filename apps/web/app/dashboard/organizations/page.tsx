import Link from 'next/link';
import { auth } from '@/auth';
import { OrganizationForm } from '@/components/OrganizationForm';
import { listOrganizations } from '@/lib/organizations-api-client';
import { createOrganizationAction } from './actions';

export default async function OrganizationsPage() {
  const session = await auth();
  const organizations = session?.accessToken ? await listOrganizations(session.accessToken) : [];

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Organizations</h1>
      <ul className="flex flex-col gap-2">
        {organizations.map((org) => (
          <li key={org.id}>
            <Link href={`/dashboard/organizations/${org.id}/members`}>{org.name}</Link>{' '}
            <span className="text-sm">
              ({org.role}
              {org.isPersonal ? ', personal' : ''})
            </span>
          </li>
        ))}
      </ul>
      <h2 className="text-xl font-semibold">Create a new organization</h2>
      <OrganizationForm action={createOrganizationAction} submitLabel="Create organization" />
    </main>
  );
}
