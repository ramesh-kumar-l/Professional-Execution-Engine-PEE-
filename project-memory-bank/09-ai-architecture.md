# 09 — AI Architecture

Source of truth: `SYSTEM_PROMPT.md` §5 (Principle 3: AI Native), §57 (AI Systems Engineer role), §59-60 (AI Collaboration Principles, AI Decision Framework), §99-100 (AI-native UX, Explainable AI) — `System_Prompt/Part1.md`, `Part5.md`, `Part6.md`.

## Status

**TBD — no AI subsystem implemented yet.** Per the phase roadmap ([16-roadmap.md](16-roadmap.md)), dedicated AI Integration is Phase 6, though the AI-Native principle applies to design decisions from Phase 0 onward (intelligence must be assumed throughout the stack, not bolted on later).

## Governing rules for whenever AI features are designed

- AI recommends, the human decides — final authority over significant actions stays with the user (Principle 4, [01-product-principles.md](01-product-principles.md)).
- Every recommendation must expose: reason, confidence, relevant context, supporting evidence, alternative actions (§100).
- AI amplifies engineering/product quality — never used merely to generate more code or content (§59).
- Must support multiple LLM providers without architectural rewrite (§10).
- Quality bar for AI-native features: see `evaluation/` (Group 12) once populated.

## What goes here once implemented

Concrete architecture for prompts, memory/retrieval, orchestration, agent coordination, and evaluation — plus which LLM provider(s) are integrated and how the provider-abstraction layer works.
