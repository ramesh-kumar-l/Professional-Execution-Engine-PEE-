import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getAnalyticsSummary, getAnalyticsTimeTracking, getAnalyticsVelocity } from '@/lib/analytics-api-client';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes}m`;
}

function formatPercent(rate: number | null): string {
  return rate === null ? 'n/a' : `${Math.round(rate * 100)}%`;
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.accessToken) {
    notFound();
  }

  const [summary, velocity, timeTracking] = await Promise.all([
    getAnalyticsSummary(session.accessToken),
    getAnalyticsVelocity(session.accessToken, 14),
    getAnalyticsTimeTracking(session.accessToken, 'goal'),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Summary</h2>
        <p>Total time tracked: {formatDuration(summary.totalTimeTrackedSeconds)}</p>
        <p>AI suggestion acceptance rate: {formatPercent(summary.aiRecommendations.acceptanceRate)}</p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <StatusBreakdown title="Projects" byStatus={summary.projectsByStatus} />
          <StatusBreakdown title="Goals" byStatus={summary.goalsByStatus} />
          <StatusBreakdown title="Tasks" byStatus={summary.tasksByStatus} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Velocity (last {velocity.days} days)</h2>
        {velocity.points.every((point) => point.tasksCompleted === 0 && point.goalsCompleted === 0) ? (
          <p>No completions recorded in this window yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th>Date</th>
                <th>Tasks completed</th>
                <th>Goals completed</th>
              </tr>
            </thead>
            <tbody>
              {velocity.points.map((point) => (
                <tr key={point.date}>
                  <td>{point.date}</td>
                  <td>{point.tasksCompleted}</td>
                  <td>{point.goalsCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Time tracked by goal</h2>
        {timeTracking.entries.length === 0 ? (
          <p>No tracked time yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {timeTracking.entries.map((entry) => (
              <li key={entry.id} className="flex justify-between border-b border-white/10 pb-1">
                <span>{entry.title}</span>
                <span>{formatDuration(entry.totalSeconds)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatusBreakdown({ title, byStatus }: { title: string; byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus);
  return (
    <div>
      <div className="font-medium">{title}</div>
      {entries.length === 0 ? (
        <div className="text-white/70">None yet</div>
      ) : (
        entries.map(([status, count]) => (
          <div key={status} className="text-white/70">
            {status}: {count}
          </div>
        ))
      )}
    </div>
  );
}
