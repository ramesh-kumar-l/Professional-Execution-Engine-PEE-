# 09 — AI Architecture

Source of truth: `SYSTEM_PROMPT.md` §5 (Principle 3: AI Native), §57 (AI Systems Engineer role), §59-60 (AI Collaboration Principles, AI Decision Framework), §99-100 (AI-native UX, Explainable AI) — `System_Prompt/Part1.md`, `Part5.md`, `Part6.md`.

## Status

**Implemented, Phase 6, 2026-07-18.** Provider abstraction decided in Phase 0.5 ([adr/0006](../adr/0006-ai-llm-provider-abstraction.md)); built and consumed by a real feature in Phase 6.

## Resolved: provider abstraction shape

A first-party `AIProvider` interface lives in a dedicated `ai` Nest module (see `03-system-architecture.md`). Anthropic Claude is the first implementation; OpenAI is the second, added specifically to prove the interface generalizes before any feature depends on provider-specific behavior. Feature code never calls a vendor SDK directly. Full rationale: [adr/0006](../adr/0006-ai-llm-provider-abstraction.md).

## Governing rules for whenever AI features are designed

- AI recommends, the human decides — final authority over significant actions stays with the user (Principle 4, [01-product-principles.md](01-product-principles.md)).
- Every recommendation must expose: reason, confidence, relevant context, supporting evidence, alternative actions (§100).
- AI amplifies engineering/product quality — never used merely to generate more code or content (§59).
- Must support multiple LLM providers without architectural rewrite (§10).
- Quality bar for AI-native features: see `evaluation/` (Group 12) once populated.

## Implemented architecture (`services/ai`, `@pee/ai`)

- **Provider abstraction:** `AIProvider` interface exposes only `complete(request): Promise<AICompletionResult>` — `stream`/`embed` are deliberately not built yet (no feature needs them; adr/0006 lists them as illustrative, not mandatory). `createAIProvider(config)` is a Nest DI factory, keyed by `AI_PROVIDER_TOKEN`, that reads `AI_PROVIDER` (`anthropic` default, or `openai`) and constructs only that vendor's implementation — the inactive vendor's API key is never required. Throws synchronously at boot if the active provider's key is missing (AI is a first-class capability per Principle 3, not something that should silently no-op).
- **Structured output:** `AICompletionRequest.responseSchema` is a JSON Schema; each provider fulfills it with its own native mechanism — `AnthropicProvider` forces a tool-use call (`tool_choice: { type: 'tool', ... }`), `OpenAIProvider` uses `response_format: { type: 'json_schema', ... }`. Hidden entirely behind the common interface.
- **Reliability:** every vendor call runs under an explicit `AbortController` timeout (~20s, `createTimeoutController`) independent of SDK defaults, so a hung vendor call can never block a request indefinitely. Vendor errors are mapped to a typed `AIProviderError` (`TIMEOUT`/`NETWORK`/`RATE_LIMITED`/`INVALID_RESPONSE`/`UNKNOWN`) before ever reaching a response body.
- **Multi-provider-safe, proven not just asserted:** `ai-provider.contract.spec.ts` runs the same behavioral assertions (request/response shape, timeout wiring) against both `AnthropicProvider` and `OpenAIProvider` with the vendor SDKs mocked.
- **First real feature — goal → task-breakdown suggestions:** `AIRecommendationsService.generateTaskSuggestions` builds a bounded prompt (goal title/description + at most 50 existing task titles) via `task-breakdown-prompt.ts`, calls `AIProvider.complete()` with a suggestions JSON Schema, defensively re-validates the parsed structure (`parseSuggestions`/`parseSuggestion` — never trusts the vendor actually honored the schema), and persists an `AIRecommendation` row (`context`, `suggestions`, `provider`, `model`) as `PENDING`. Nothing is written to `Task` at this point.
- **Explainability enforcement point:** `AIRecommendationResponse`/`AITaskSuggestion` (in `packages/types/src/ai.types.ts`) structurally require `reason`/`confidence`/`alternatives` per suggestion and a top-level `context` (what the model actually saw) — every current/future recommendation feature flows through `AIRecommendationsService`, so §100 is enforced once, not per-caller.
- **Human control as a structural gate, not a UI convention:** `accept(ownerId, id, { acceptedIndices })` reuses `TasksService.create` per selected suggestion (so the Phase 3 rollup fires identically to a manually-created task) and marks the recommendation `ACCEPTED`; `dismiss` marks it `DISMISSED` and creates nothing; re-responding to a non-`PENDING` recommendation is rejected (409).
- **Fails gracefully:** a provider throw or unparseable structured output is caught, the attempt is persisted as `FAILED` (traceable, never silently dropped), and the caller gets a clean `ServiceUnavailableException` — never a partial or fabricated suggestion.

## What's still open for later AI features

Retrieval/memory (would need `embed()`), streaming responses, agent coordination/orchestration across multiple tool calls, and a dedicated evaluation harness beyond `evaluation/ai-feature-quality-bar.md`'s manual checklist — none needed yet by the one feature shipped in Phase 6. See [27-backlog.md](27-backlog.md) for additional AI-native feature candidates (progress narratives, smart prioritization, natural-language task capture).
