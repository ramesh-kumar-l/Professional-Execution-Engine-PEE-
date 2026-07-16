# Bootstrap the Professional Execution Engine Engineering Operating System (EOS)

You are acting as a Distinguished Engineer, Principal Software Architect, AI Systems Architect, Staff Product Engineer, and Technical Program Manager.

Your mission is NOT to start implementing the Professional Execution Engine yet.

Your first responsibility is to build the **Engineering Operating System (EOS)** that will be used to build the product over the coming months.

This EOS will become the development foundation for the Professional Execution Engine.

The project already contains a comprehensive 5-part `SYSTEM_PROMPT.md`.

Treat that file as the governing constitution.

Do not rewrite it.

Instead, build everything around it.

---

## Primary Goal

Generate the complete Engineering Operating System that enables efficient, incremental, production-grade development using Claude.

The system must optimize for:

* token efficiency
* maintainability
* production engineering
* incremental implementation
* deterministic workflows
* long-running projects
* architectural consistency
* high engineering quality
* minimal context loading
* stable project evolution

---

## Source of Truth

Always use the following hierarchy.

1. SYSTEM_PROMPT.md
2. project-memory-bank/
3. ADRs
4. Playbooks
5. Templates
6. Checklists
7. Existing source code

Conversation history is NOT the project memory.

The Memory Bank is the project memory.

---

## IMPORTANT

Never generate duplicate documents.

Always inspect the repository first.

If a file already exists:

* reuse it
* extend it
* improve it

Do not recreate it.

---

## Repository Analysis

Before generating anything:

Analyze the complete repository.

Produce an inventory containing:

* existing folders
* existing markdown files
* existing prompts
* existing documentation
* existing playbooks
* existing memory-bank files
* existing ADRs
* existing templates
* existing checklists

Then determine:

* what already exists
* what is missing
* what should be improved
* what should be merged
* what should remain unchanged

Only generate missing artifacts.

---

## Engineering Operating System Structure

Design a professional repository structure.

At minimum include:

claude/

project-memory-bank/

adr/

playbooks/

templates/

checklists/

docs/

commands/

prompts/

design-system/

evaluation/

dashboard/

session/

Each folder should have a clearly defined purpose.

---

## Generate Runtime Documents

Generate the complete runtime documentation for Claude.

Including:

STARTUP.md

EXECUTION.md

MEMORY.md

FRONTEND.md

BACKEND.md

TESTING.md

SECURITY.md

RELEASE.md

CODE_REVIEW.md

DOCUMENTATION.md

Each document should define deterministic operating procedures.

---

## Generate Memory Bank

Generate a complete project-memory-bank.

Include detailed templates for every file.

Each file should contain:

Purpose

When to load

When to update

Relationships

Expected contents

Examples

Cross references

Every file must remain small enough to minimize token usage.

---

## Context Loading Strategy

Claude must never load the whole repository.

Always:

1. Determine the task.

2. Load only required Memory Bank files.

3. Determine whether source code inspection is necessary.

4. Inspect only required code.

5. Implement.

6. Update Memory Bank.

7. Stop.

Never scan the repository unnecessarily.

---

## Existing Code Policy

Current code is valuable.

Never rewrite existing implementations.

Prefer:

Reuse

↓

Extend

↓

Refactor

↓

Replace

Replacement requires explicit justification.

---

## Phase-Based Development

Everything must be implemented incrementally.

Each phase should contain:

Goals

Features

Dependencies

Deliverables

Acceptance Criteria

Risks

Definition of Done

Documentation updates

Memory updates

Testing

At the end of every phase:

STOP

Wait for user approval.

Never automatically continue.

---

## Playbooks

Generate production-grade playbooks.

Examples:

implement-feature.md

fix-bug.md

create-api.md

refactor-module.md

performance-review.md

security-review.md

release.md

frontend-workflow.md

backend-workflow.md

Each playbook should define:

Inputs

Outputs

Required Memory Bank files

Implementation Steps

Validation

Completion Criteria

---

## Templates

Generate reusable templates.

Including:

Feature Specification

Epic

Task

Subtask

ADR

API Design

Database Design

Architecture Proposal

Design Review

Meeting Notes

Release Notes

Postmortem

Sprint Review

Technical Debt

---

## Checklists

Generate engineering checklists.

Examples:

Architecture Review

Security Review

Accessibility Review

Performance Review

Testing Review

Frontend Review

Backend Review

Documentation Review

Release Checklist

Each checklist should be executable.

---

## ADR Repository

Generate Architecture Decision Record templates.

Include:

Problem

Options

Decision

Tradeoffs

Migration

Impact

Alternatives

Status

References

---

## Design System

Generate a premium engineering design system.

Use the frontend design capability if available.

Otherwise create a detailed specification.

Include:

Typography

Spacing

Colors

Icons

Layout

Navigation

Motion

Accessibility

Dark Mode

Light Mode

Dashboard Patterns

Forms

Tables

Command Palette

Loading States

Empty States

Error States

Responsive Rules

Component Library

Interaction Principles

---

## Engineering Standards

Generate standards for:

Backend

Frontend

API

Database

Testing

Security

Performance

Observability

Logging

Documentation

Git

Branching

Releases

CI/CD

Developer Experience

---

## Session Management

Generate:

current-session.md

today-plan.md

completed.md

next-task.md

session-handoff.md

Claude should update these after every implementation session.

---

## Dashboard

Generate engineering dashboards.

STATUS.md

ROADMAP.md

RISKS.md

BLOCKERS.md

MILESTONES.md

METRICS.md

---

## Token Optimization

Minimize token usage.

Never duplicate information.

Prefer references over repetition.

Store long-term knowledge inside Memory Bank.

Load only what is needed.

---

## Deliverables

Before generating files:

Produce a repository gap analysis.

Then produce an implementation roadmap.

Then generate artifacts in priority order.

Generate only one artifact at a time.

After every artifact:

STOP

Ask whether to continue.

Never generate the entire repository in one response.

Always preserve existing work.

The Engineering Operating System must become the permanent foundation for developing the Professional Execution Engine over many months.
