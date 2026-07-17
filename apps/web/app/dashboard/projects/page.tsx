import Link from 'next/link';
import { auth } from '@/auth';
import { listProjects } from '@/lib/api-client';
import { archiveProjectAction } from './actions';

export default async function ProjectsPage() {
  const session = await auth();
  const { data: projects } = session?.accessToken
    ? await listProjects(session.accessToken)
    : { data: [] };

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link href="/dashboard/projects/new">New project</Link>
      </div>

      {projects.length === 0 && <p>No projects yet.</p>}

      <ul className="flex flex-col gap-2">
        {projects.map((project) => (
          <li key={project.id} className="flex items-center justify-between border-b border-white/10 pb-2">
            <Link href={`/dashboard/projects/${project.id}`}>{project.name}</Link>
            <form action={archiveProjectAction.bind(null, project.id)}>
              <button type="submit">Archive</button>
            </form>
          </li>
        ))}
      </ul>

      <Link href="/dashboard">Back to dashboard</Link>
    </main>
  );
}
