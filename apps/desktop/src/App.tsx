import type { UserProfile } from '@pee/types';
import { useEffect, useState } from 'react';
import { SyncStatusBadge } from './components/SyncStatusBadge';
import { getBridge } from './lib/pee-bridge';
import { Analytics } from './pages/Analytics';
import { GoalDetail } from './pages/GoalDetail';
import { Login } from './pages/Login';
import { Projects } from './pages/Projects';

type View = { name: 'projects' } | { name: 'goal'; projectId: string } | { name: 'analytics' };

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [view, setView] = useState<View>({ name: 'projects' });

  useEffect(() => {
    getBridge()
      .auth.getSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setCheckedSession(true));
  }, []);

  if (!checkedSession) return null;

  if (!user) {
    return <Login onLoggedIn={setUser} />;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome, {user.displayName}</h1>
        <div className="flex items-center gap-4">
          <SyncStatusBadge />
          <button
            type="button"
            onClick={() => {
              getBridge()
                .auth.logout()
                .then(() => setUser(null));
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <nav className="flex gap-4">
        <button type="button" onClick={() => setView({ name: 'projects' })}>
          Projects
        </button>
        <button type="button" onClick={() => setView({ name: 'analytics' })}>
          Analytics
        </button>
      </nav>

      {view.name === 'projects' && <Projects onOpenProject={(projectId) => setView({ name: 'goal', projectId })} />}
      {view.name === 'goal' && <GoalDetail projectId={view.projectId} onBack={() => setView({ name: 'projects' })} />}
      {view.name === 'analytics' && <Analytics />}
    </main>
  );
}
