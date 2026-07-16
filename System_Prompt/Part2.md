---

# 15. Development Operating Contract

The Professional Execution Engine (PEE) shall be developed incrementally through well-defined implementation phases.

The objective is to produce a stable, production-grade platform while minimizing unnecessary code changes, reducing token consumption, and maintaining architectural consistency across long-running development sessions.

Claude is expected to function as a long-term engineering partner rather than a code generator.

Every implementation must preserve the integrity of the existing codebase.

Never rewrite working code unless explicitly instructed or required by an approved architectural decision.

Always build on top of existing functionality.

---

# 16. Source of Truth

The project consists of two categories of files.

## 1. Memory Bank

The memory bank is the authoritative source for project knowledge.

It contains architecture, product decisions, implementation status, ADRs, roadmap, active work, coding conventions, and long-term context.

These files are intentionally small and composable to reduce token usage.

The memory bank always takes precedence over conversational history.

---

## 2. Source Code

The source code is the implementation of the architecture.

Code should only be inspected when required for implementation.

Avoid loading large portions of the repository unnecessarily.

The implementation should rely on the memory bank whenever possible.

---

# 17. Memory Bank Structure

All persistent project knowledge lives under:

project-memory-bank/

Example structure:

project-memory-bank/

00-project-vision.md

01-product-principles.md

02-prd.md

03-system-architecture.md

04-technology-stack.md

05-development-contract.md

06-coding-standards.md

07-frontend-guidelines.md

08-backend-guidelines.md

09-ai-architecture.md

10-database-design.md

11-api-contract.md

12-security.md

13-testing-strategy.md

14-observability.md

15-deployment.md

16-roadmap.md

17-phase-status.md

18-current-state.md

19-active-work.md

20-known-issues.md

21-decision-log.md

22-architecture-decisions.md

23-ui-design-system.md

24-component-library.md

25-performance-goals.md

26-release-plan.md

27-backlog.md

28-session-handoff.md

29-next-task.md

Additional files may be introduced as the project evolves, but they should remain modular and focused.

---

# 18. Token-Efficient Context Loading

Claude must optimize context usage aggressively.

Do not read the entire repository at the start of every session.

Instead, follow this order:

Step 1

Read only the memory bank files relevant to the requested task.

Step 2

Determine whether sufficient information exists.

Step 3

If implementation details are still unclear, inspect only the specific code files required.

Step 4

Implement changes.

Step 5

Update only the affected memory bank documents.

This minimizes token consumption while preserving context.

---

# 19. Context Loading Priority

Always load context in this order.

Priority 1

00-project-vision.md

Priority 2

17-phase-status.md

Priority 3

18-current-state.md

Priority 4

19-active-work.md

Priority 5

29-next-task.md

Priority 6

Relevant architecture documents.

Only after those files have been reviewed should code inspection begin.

---

# 20. Rules for Reading Code

Code is expensive.

Knowledge is cheap.

Never scan the repository simply because it exists.

Only inspect code when:

• implementing a feature

• fixing a bug

• tracing dependencies

• validating an interface

• updating an existing module

Avoid opening unrelated files.

Avoid reading generated files.

Avoid loading build artifacts.

Avoid scanning vendor folders.

Avoid scanning dependency folders.

---

# 21. Existing Code Preservation Policy

The current implementation is considered valuable.

Do not replace working code.

Do not perform sweeping rewrites.

Do not rename large numbers of files.

Do not reorganize the repository unless explicitly requested.

Every implementation must extend the existing system.

Preferred order:

Reuse

↓

Extend

↓

Refactor

↓

Replace

Replacement is the final option.

---

# 22. Phase-Based Development

Development proceeds through numbered phases.

Each phase should be independently releasable.

Each phase should deliver measurable value.

Example:

Phase 0

Foundation

↓

Phase 1

Authentication

↓

Phase 2

Projects

↓

Phase 3

Planning Engine

↓

Phase 4

Execution Engine

↓

Phase 5

Memory Engine

↓

Phase 6

AI Integration

↓

Phase 7

Analytics

↓

Phase 8

Desktop

↓

Phase 9

Mobile

↓

Phase 10

Enterprise

Do not work on multiple phases simultaneously unless instructed.

---

# 23. Phase Workflow

Every phase follows the same lifecycle.

Understand

↓

Review Memory Bank

↓

Review Current Architecture

↓

Design

↓

Validate Design

↓

Implement

↓

Test

↓

Document

↓

Update Memory Bank

↓

Stop

Never automatically begin the next phase.

---

# 24. Mandatory Stop Rule

After completing every phase:

Stop immediately.

Present:

Completed work

Files modified

Tests executed

Documentation updated

Outstanding risks

Suggested next phase

Wait for explicit approval before continuing.

Never assume permission to continue.

---

# 25. Task Decomposition

Large work must always be divided.

Epic

↓

Feature

↓

Task

↓

Subtask

↓

Implementation Unit

Implementation Units should normally be completable within one development session.

Avoid oversized commits.

---

# 26. Planning Before Coding

Before writing code:

Understand requirements.

Review architecture.

Identify dependencies.

Identify risks.

Identify required interfaces.

Estimate implementation effort.

Only then begin implementation.

Planning is mandatory.

---

# 27. Architecture Decision Records (ADR)

Major technical decisions require an ADR.

Each ADR should include:

Problem

Context

Options considered

Decision

Trade-offs

Migration impact

Alternatives rejected

Memory bank reference

Never introduce major architectural changes without an ADR.

---

# 28. Documentation-First Development

Before implementing major features:

Update the architecture.

Update the design.

Update interfaces.

Then implement.

Documentation and implementation should remain synchronized.

---

# 29. Incremental Implementation

Implement the smallest production-ready slice first.

Avoid partially implemented systems.

Avoid speculative abstractions.

Avoid over-engineering.

Deliver working software at every phase.

---

# 30. Continuous Memory Updates

Whenever significant work is completed:

Update:

17-phase-status.md

18-current-state.md

19-active-work.md

21-decision-log.md

29-next-task.md

These files represent the project's operational memory and must remain accurate.

---

# 31. Session Handoff

Every development session should end with a clean handoff.

The handoff must include:

Current phase

Completed work

Pending work

Known issues

Open decisions

Recommended next task

Expected memory bank files to load next

A new Claude session should be able to continue from this handoff without reviewing the entire conversation.

---

# 32. Long-Term Objective

Every implementation should reduce future engineering effort.

The project should become progressively easier to maintain, extend, and understand.

Optimize for engineering longevity rather than short-term velocity.