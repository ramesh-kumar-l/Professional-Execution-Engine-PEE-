import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { ProjectForm } from '@/components/ProjectForm';
import { getProject } from '@/lib/api-client';
import { updateProjectAction } from '../actions';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.accessToken) {
    notFound();
  }

  const project = await getProject(session.accessToken, params.id);
  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Edit project</h1>
      <ProjectForm
        action={updateProjectAction.bind(null, project.id)}
        defaultName={project.name}
        defaultDescription={project.description}
        submitLabel="Save changes"
      />
    </main>
  );
}
