# ADR-0006: AI/LLM Provider Abstraction

- **Status:** Accepted
- **Date:** 2026-07-17
- **Phase:** 0.5 (Foundation — Architecture ADR)

## Problem

`09-ai-architecture.md` and `04-technology-stack.md` leave the AI/LLM provider TBD. §10 requires the architecture support multiple LLM providers without a rewrite; Principle 3 (AI Native) requires intelligence be foundational from Phase 0 onward, so the abstraction shape must exist before any AI feature is built (Phase 6), even though no AI feature ships yet.

## Context

- Backend is NestJS (ADR-0002); AI features must expose reason/confidence/context/evidence/alternatives per §100 (Explainable AI) and keep the human as final decision-maker per Principle 4.
- No AI feature exists yet — this ADR fixes the integration shape, not any specific prompt/agent design (that belongs to Phase 6 and `09-ai-architecture.md`'s "what goes here once implemented" section).

## Options Considered

1. **Provider-agnostic interface (an `AIProvider` port with methods like `complete`, `stream`, `embed`) inside a dedicated NestJS module, with Anthropic Claude as the first concrete implementation and OpenAI as a second implementation proving the abstraction holds.** No feature code calls a vendor SDK directly — only the port.
2. **Integrate directly against one vendor SDK (e.g., call the Anthropic SDK straight from feature code).** Fastest to first feature, but ties every AI call site to one vendor, violating §10 and requiring a rewrite the moment a second provider or a per-tenant provider choice is needed.
3. **Adopt a third-party LLM-orchestration framework as the abstraction layer instead of a first-party interface.** Offloads abstraction design, but adds a heavy dependency and its own opinions (chains, agents) before we have a single real use case to validate against — premature per Sustainable Complexity.

## Decision

**Option 1.** A first-party `AIProvider` interface lives in a dedicated `ai` module (per ADR-0002's module-boundary pattern), with **Anthropic Claude** as the first implementation (this project already runs on Claude Code, and Anthropic has first-party TypeScript SDK support matching the backend language, ADR-0002) and **OpenAI** as the second implementation, added specifically to prove the interface generalizes before any feature depends on provider-specific behavior. Every AI-assisted feature calls the interface, never a vendor SDK directly, and every response passed to a user surfaces reason/confidence/context/evidence/alternatives per §100, enforced at the interface boundary, not left to each caller.

## Trade-offs

Gained: provider swap or per-tenant/per-feature provider choice later requires no rewrite, only a new implementation of the port; Explainable AI fields are structurally guaranteed rather than optional. Given up: slightly more upfront design than calling a vendor SDK directly, and no AI feature exists yet to validate the interface against real usage — mitigated by implementing two providers immediately rather than deferring the second until "someday."

## Migration Impact

None yet — no AI code exists. Fixes the shape `09-ai-architecture.md`'s "what goes here once implemented" section will be filled in against, starting Phase 6.

## Alternatives Rejected

Option 2 rejected: directly contradicts the explicit §10 multi-provider architecture goal and would force a rewrite at the first sign of vendor diversification. Option 3 rejected per Sustainable Complexity — adopting an orchestration framework's abstractions before a single real AI feature exists risks fitting the product to the framework's assumptions rather than the reverse.

## Memory Bank Reference

`project-memory-bank/09-ai-architecture.md`, `04-technology-stack.md`, `evaluation/ai-feature-quality-bar.md`.
