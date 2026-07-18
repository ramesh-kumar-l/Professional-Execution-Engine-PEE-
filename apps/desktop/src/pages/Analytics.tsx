import type { AnalyticsSummaryResponse, AnalyticsTimeTrackingResponse, AnalyticsVelocityResponse } from '@pee/types';
import { useEffect, useState } from 'react';
import { getBridge } from '../lib/pee-bridge';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/** Read-only, online-only — analytics isn't part of @pee/local-client's sync registry. */
export function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [velocity, setVelocity] = useState<AnalyticsVelocityResponse | null>(null);
  const [timeTracking, setTimeTracking] = useState<AnalyticsTimeTrackingResponse | null>(null);

  useEffect(() => {
    const bridge = getBridge();
    bridge.analytics.getSummary().then(setSummary);
    bridge.analytics.getVelocity(14).then(setVelocity);
    bridge.analytics.getTimeTracking('goal').then(setTimeTracking);
  }, []);

  if (!summary) return <p>Needs a connection — analytics is fetched live from services/api.</p>;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-semibold">Summary</h2>
        <p>Total time tracked: {formatDuration(summary.totalTimeTrackedSeconds)}</p>
        <p>
          AI acceptance rate:{' '}
          {summary.aiRecommendations.acceptanceRate === null
            ? 'n/a'
            : `${Math.round(summary.aiRecommendations.acceptanceRate * 100)}%`}
        </p>
      </div>

      {velocity && (
        <div>
          <h2 className="font-semibold">Velocity (last {velocity.days} days)</h2>
          <ul className="flex flex-col gap-1">
            {velocity.points.map((point) => (
              <li key={point.date}>
                {point.date}: {point.tasksCompleted} tasks, {point.goalsCompleted} goals
              </li>
            ))}
          </ul>
        </div>
      )}

      {timeTracking && (
        <div>
          <h2 className="font-semibold">Time tracked by goal</h2>
          <ul className="flex flex-col gap-1">
            {timeTracking.entries.map((entry) => (
              <li key={entry.id}>
                {entry.title}: {formatDuration(entry.totalSeconds)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
