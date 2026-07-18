import { auth } from '@/auth';
import { ProjectForm } from '@/components/ProjectForm';
import { createProjectAction } from '../actions';

export default async function NewProjectPage() {
  const session = await auth();
  const organizations = session?.user.organizations ?? [];

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">New project</h1>
      <ProjectForm action={createProjectAction} organizations={organizations} submitLabel="Create project" />
    </main>
  );
}
