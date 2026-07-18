import type { AITaskSuggestion } from '@pee/types';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { RemoteClient } from '../api/remote-client';

interface Suggestion {
  id: string;
  suggestions: AITaskSuggestion[];
}

/** Mirrors apps/desktop's AiSuggestionsPanel.tsx — human-approval gate before any Task is
 *  created, same as every other client that consumes @pee/ai's recommendation endpoints. */
export function AiSuggestionsPanel({
  goalId,
  remote,
  onAccepted,
}: {
  goalId: string;
  remote: RemoteClient;
  onAccepted: () => void;
}): React.JSX.Element {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleGenerate(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await remote.generateAiSuggestions(goalId);
    setPending(false);
    if (result && typeof result === 'object' && 'error' in result) {
      setError((result as { error: string }).error);
      return;
    }
    setSuggestion(result as Suggestion);
  }

  async function handleAccept(): Promise<void> {
    if (!suggestion) return;
    const acceptedIndices = suggestion.suggestions.map((_, index) => index);
    await remote.acceptAiRecommendation(suggestion.id, acceptedIndices);
    setSuggestion(null);
    onAccepted();
  }

  async function handleDismiss(): Promise<void> {
    if (!suggestion) return;
    await remote.dismissAiRecommendation(suggestion.id);
    setSuggestion(null);
  }

  return (
    <View className="gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-black dark:text-white">AI task suggestions</Text>
        <Pressable onPress={handleGenerate} disabled={pending}>
          <Text className="text-blue-600">{pending ? 'Generating…' : 'Suggest tasks'}</Text>
        </Pressable>
      </View>

      {error && <Text className="text-red-500">{error}</Text>}

      {suggestion && (
        <View className="gap-2">
          {suggestion.suggestions.map((task, index) => (
            <Text key={index} className="text-black dark:text-white">
              • {task.title}
            </Text>
          ))}
          <View className="flex-row gap-4">
            <Pressable onPress={handleAccept}>
              <Text className="text-blue-600">Accept all</Text>
            </Pressable>
            <Pressable onPress={handleDismiss}>
              <Text className="text-blue-600">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
