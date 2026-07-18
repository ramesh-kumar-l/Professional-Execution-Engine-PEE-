import type { AIRecommendationResponse } from '@pee/types';
import { useState } from 'react';
import { getBridge } from '../lib/pee-bridge';

export function AiSuggestionsPanel({ goalId, onAccepted }: { goalId: string; onAccepted: () => void }) {
  const [suggestion, setSuggestion] = useState<AIRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleGenerate() {
    setPending(true);
    setError(null);
    const result = await getBridge().ai.generateSuggestions(goalId);
    setPending(false);
    if (result && typeof result === 'object' && 'error' in result) {
      setError((result as { error: string }).error);
      return;
    }
    setSuggestion(result as AIRecommendationResponse);
  }

  async function handleAccept() {
    if (!suggestion) return;
    const acceptedIndices = suggestion.suggestions.map((_, index) => index);
    await getBridge().ai.acceptRecommendation(suggestion.id, acceptedIndices);
    setSuggestion(null);
    onAccepted();
  }

  async function handleDismiss() {
    if (!suggestion) return;
    await getBridge().ai.dismissRecommendation(suggestion.id);
    setSuggestion(null);
  }

  return (
    <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">AI task suggestions</h2>
        <button type="button" onClick={handleGenerate} disabled={pending}>
          {pending ? 'Generating…' : 'Suggest tasks'}
        </button>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      {suggestion && (
        <div className="flex flex-col gap-2">
          <ul className="list-disc pl-5">
            {suggestion.suggestions.map((task, index) => (
              <li key={index}>{task.title}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button type="button" onClick={handleAccept}>
              Accept all
            </button>
            <button type="button" onClick={handleDismiss}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
