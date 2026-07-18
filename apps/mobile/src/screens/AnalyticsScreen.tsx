import type { AnalyticsSummaryResponse, AnalyticsTimeTrackingResponse, AnalyticsVelocityResponse } from '@pee/types';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useAuth } from '../auth/auth-context';
import { RemoteClient } from '../api/remote-client';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/** Read-only, online-only — mirrors apps/desktop's Analytics.tsx. Analytics isn't part of
 *  MobileStore/MobileSyncClient's sync scope, so this is a plain fetch, no local cache. */
export function AnalyticsScreen(): React.JSX.Element {
  const { session } = useAuth();
  const remote = useMemo(() => new RemoteClient(session), [session]);
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [velocity, setVelocity] = useState<AnalyticsVelocityResponse | null>(null);
  const [timeTracking, setTimeTracking] = useState<AnalyticsTimeTrackingResponse | null>(null);

  useEffect(() => {
    remote.getAnalyticsSummary().then(setSummary);
    remote.getAnalyticsVelocity(14).then(setVelocity);
    remote.getAnalyticsTimeTracking('goal').then(setTimeTracking);
  }, [remote]);

  if (!summary) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-black dark:text-white">Needs a connection — analytics is fetched live from services/api.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-6 p-6">
      <View>
        <Text className="font-semibold text-black dark:text-white">Summary</Text>
        <Text className="text-black dark:text-white">Total time tracked: {formatDuration(summary.totalTimeTrackedSeconds)}</Text>
        <Text className="text-black dark:text-white">
          AI acceptance rate:{' '}
          {summary.aiRecommendations.acceptanceRate === null ? 'n/a' : `${Math.round(summary.aiRecommendations.acceptanceRate * 100)}%`}
        </Text>
      </View>

      {velocity && (
        <View>
          <Text className="font-semibold text-black dark:text-white">Velocity (last {velocity.days} days)</Text>
          <FlatList
            data={velocity.points}
            keyExtractor={(point) => point.date}
            renderItem={({ item }) => (
              <Text className="text-black dark:text-white">
                {item.date}: {item.tasksCompleted} tasks, {item.goalsCompleted} goals
              </Text>
            )}
          />
        </View>
      )}

      {timeTracking && (
        <View>
          <Text className="font-semibold text-black dark:text-white">Time tracked by goal</Text>
          <FlatList
            data={timeTracking.entries}
            keyExtractor={(entry) => entry.id}
            renderItem={({ item }) => (
              <Text className="text-black dark:text-white">
                {item.title}: {formatDuration(item.totalSeconds)}
              </Text>
            )}
          />
        </View>
      )}
    </View>
  );
}
