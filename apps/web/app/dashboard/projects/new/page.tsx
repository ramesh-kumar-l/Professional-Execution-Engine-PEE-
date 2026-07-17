import { ProjectForm } from '@/components/ProjectForm';
import { createProjectAction } from '../actions';

export default function NewProjectPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">New project</h1>
      <ProjectForm action={createProjectAction} submitLabel="Create project" />
    </main>
  );
}
