import Link from 'next/link';
import type { ReactNode } from 'react';
import { auth } from '@/auth';

/**
 * First shared dashboard shell (Phase 10) — wraps every /dashboard/* route without
 * touching existing pages. The org switcher is a UI convenience only: there is no
 * server-side "active organization" session state (see adr/0009), it just links to
 * /dashboard/projects?organizationId=<id>.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const organizations = session?.user.organizations ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <nav className="flex flex-wrap items-center gap-4 border-b border-white/10 pb-4">
        <Link href="/dashboard">Home</Link>
        <Link href="/dashboard/projects">Projects</Link>
        <Link href="/dashboard/execution">Active work</Link>
        <Link href="/dashboard/analytics">Analytics</Link>
        <Link href="/dashboard/organizations">Organizations</Link>
        {organizations.length > 0 && (
          <span className="ml-auto flex items-center gap-2 text-sm">
            <span>Org:</span>
            {organizations.map((org) => (
              <Link key={org.id} href={`/dashboard/projects?organizationId=${org.id}`}>
                {org.name}
                {org.isPersonal ? ' (personal)' : ''}
              </Link>
            ))}
          </span>
        )}
      </nav>
      {children}
    </div>
  );
}
