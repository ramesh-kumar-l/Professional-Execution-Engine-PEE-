import { useEffect, useState, type FormEvent } from 'react';
import { getBridge } from '../lib/pee-bridge';

interface LocalProjectRow {
  id: string;
  name: string;
  status: string;
}

export function Projects({ onOpenProject }: { onOpenProject: (projectId: string) => void }) {
  const [projects, setProjects] = useState<LocalProjectRow[]>([]);
  const [name, setName] = useState('');

  async function refresh() {
    setProjects(await getBridge().projects.list());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await getBridge().projects.create({ name });
    setName('');
    refresh();
  }

  return (
    <section className="flex flex-col gap-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <label htmlFor="project-name" className="sr-only">
          Project name
        </label>
        <input id="project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="New project name" />
        <button type="submit">Add project</button>
      </form>

      {projects.length === 0 && <p>No projects yet.</p>}

      <ul className="flex flex-col gap-2">
        {projects.map((project) => (
          <li key={project.id} className="flex items-center justify-between border-b border-white/10 pb-2">
            <button type="button" onClick={() => onOpenProject(project.id)}>
              {project.name}
            </button>
            <span>{project.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
