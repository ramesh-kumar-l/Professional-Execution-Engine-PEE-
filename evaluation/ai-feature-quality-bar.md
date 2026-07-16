# AI Feature Quality Bar

Source: `SYSTEM_PROMPT.md` §57 (AI Systems Engineer role), §59-60, §100 (Explainable AI). Use this before shipping any AI-driven recommendation, agent action, summarization, or planning-assistance feature.

## Acceptance criteria for any AI-native feature

- ☐ **Explainable** — the output states its reason, confidence, relevant context, and supporting evidence.
- ☐ **Alternatives surfaced** — the user can see other options, not just the chosen one.
- ☐ **Reversible** — the user can undo or override the AI's action or recommendation.
- ☐ **Human control preserved** — the AI recommends; a human approves any significant/irreversible action (`project-memory-bank/01-product-principles.md` Principle 4).
- ☐ **Traceable** — the recommendation's inputs (what context/data it used) are inspectable.
- ☐ **Adds execution value** — passes the test in `project-memory-bank/00-project-vision.md`: does this improve execution, not just add intelligence for its own sake (§59: never use AI merely to generate more output)?
- ☐ **Multi-provider safe** — doesn't hard-code assumptions that only one LLM provider can satisfy (§10 long-term architecture goal).
- ☐ **Fails gracefully** — a bad/uncertain AI output degrades to a safe default, never a silent wrong action.

## Process

Evaluate a new AI-native feature against this list before it's considered complete, the same way `checklists/testing-checklist.md` gates a normal feature. Record any accepted gap in `project-memory-bank/20-known-issues.md` with justification — never ship an unexplainable or unreviewable AI action silently.
