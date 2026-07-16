---

# 69. AI Planning & Execution Engine

The Professional Execution Engine shall be developed using an execution-first methodology.

Claude is responsible not only for implementation but also for planning, sequencing, dependency management, progress tracking, documentation, and maintaining project continuity.

Implementation is only one part of the execution lifecycle.

The objective is to maximize successful project delivery while minimizing unnecessary complexity and context switching.

---

# 70. Execution Lifecycle

Every feature must follow the complete execution lifecycle.

```
Vision
    ↓
Epic
    ↓
Feature
    ↓
Task
    ↓
Subtask
    ↓
Implementation
    ↓
Validation
    ↓
Documentation
    ↓
Memory Update
    ↓
Review
    ↓
User Approval
```

Never skip stages.

Never merge unrelated work.

---

# 71. Work Hierarchy

All work must be represented using a consistent hierarchy.

```
Project

    ├── Phase

            ├── Epic

                    ├── Feature

                            ├── Task

                                    ├── Subtask

                                            ├── Implementation Unit
```

Each implementation unit should normally fit within one development session.

Large implementation units should be decomposed further.

---

# 72. Epic Planning

Before beginning an Epic, Claude must define:

Purpose

Business value

Dependencies

Architecture impact

User impact

Success metrics

Risks

Estimated implementation order

Expected documentation changes

No implementation begins until the Epic is understood.

---

# 73. Feature Planning

Every Feature should include:

Objective

Current state

Desired state

Required APIs

Database impact

UI impact

AI impact

Testing strategy

Migration requirements

Observability impact

Security considerations

Documentation updates

---

# 74. Task Planning

Before implementing any task produce:

## Goal

## Scope

## Dependencies

## Files expected to change

## Risks

## Acceptance Criteria

## Memory-bank files to update

Only then begin coding.

---

# 75. Acceptance Criteria

Every task must define measurable completion conditions.

Example:

✓ API implemented

✓ Tests passing

✓ Documentation updated

✓ Logging added

✓ Metrics added

✓ Error handling complete

✓ UI complete

✓ Accessibility reviewed

✓ Memory updated

Tasks without acceptance criteria are incomplete.

---

# 76. Dependency Management

Claude should maintain a dependency graph between work items.

Example:

Authentication

↓

User Management

↓

Projects

↓

Tasks

↓

Execution Engine

↓

Analytics

↓

Reporting

Never implement a dependent feature before its prerequisites are complete.

---

# 77. Progress Tracking

Maintain implementation progress in the memory bank.

Track:

Current Phase

Current Epic

Current Feature

Current Task

Current Subtask

Completion percentage

Known blockers

Risks

Upcoming work

Estimated next milestone

Never rely on chat history for project status.

---

# 78. Backlog Management

Ideas that are outside the current scope should never interrupt implementation.

Instead:

Record them in:

project-memory-bank/27-backlog.md

Include:

Title

Description

Reason

Priority

Potential dependencies

Estimated value

Continue current work without interruption.

---

# 79. Daily Execution Loop

Every new development session begins with:

Step 1

Read:

00-project-vision.md

17-phase-status.md

18-current-state.md

19-active-work.md

29-next-task.md

Step 2

Understand current work.

Step 3

Verify architecture.

Step 4

Review only required code.

Step 5

Implement current task.

Step 6

Run validation.

Step 7

Update memory bank.

Step 8

Stop.

Never automatically continue into another task unless explicitly instructed.

---

# 80. Task Completion Report

Every completed task should produce a concise execution report.

Include:

Task completed

Files modified

Tests executed

Documentation updated

Architectural changes

Known limitations

Suggested next task

Memory-bank files updated

Wait for user approval before proceeding.

---

# 81. Phase Completion Report

When an entire phase finishes, produce a comprehensive report.

Include:

Phase summary

Implemented capabilities

Architecture updates

Performance considerations

Security review

Testing summary

Documentation summary

Known issues

Technical debt

Future improvements

Recommended next phase

Do not begin the next phase automatically.

---

# 82. Risk Management

Continuously evaluate:

Technical risks

Architectural risks

Security risks

Performance risks

Dependency risks

Schedule risks

Maintain a risk register.

Update:

project-memory-bank/20-known-issues.md

when new risks are discovered.

---

# 83. Technical Debt Policy

Technical debt is allowed only when:

Documented

Justified

Tracked

Prioritized

Time-bounded

Every debt item should include:

Reason

Impact

Mitigation

Removal strategy

Expected removal milestone

Never accumulate undocumented technical debt.

---

# 84. Estimation Principles

Estimate work conservatively.

Classify work using:

XS

S

M

L

XL

XXL

If a task exceeds Large (L), decompose it into smaller implementation units before coding.

---

# 85. Decision Logging

Every meaningful engineering decision should be recorded.

Update:

project-memory-bank/21-decision-log.md

Include:

Decision

Reason

Alternatives considered

Expected impact

Implementation phase

Affected modules

---

# 86. Continuous Architectural Validation

During every implementation ask:

Does this still align with the product vision?

Does it simplify future work?

Does it improve maintainability?

Can another engineer understand it?

Can it scale?

Can it be tested?

Can it be monitored?

If not, redesign before implementing.

---

# 87. Session Completion Checklist

Before ending any development session verify:

✓ Code complete

✓ Tests passing

✓ Documentation updated

✓ Memory bank updated

✓ ADRs updated (if needed)

✓ Risks documented

✓ Backlog updated

✓ Next task identified

✓ Session handoff written

Only after all checklist items are complete should the session end.

---

# 88. Final Operating Principle

The Professional Execution Engine must always be developed as a sequence of small, verified, production-quality improvements.

Never sacrifice architectural integrity for implementation speed.

Every session should leave the project:

- more complete,
- more maintainable,
- better documented,
- easier to extend,
- and easier for another engineer to continue.