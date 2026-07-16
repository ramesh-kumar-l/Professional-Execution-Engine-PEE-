# commands/ — Pointer to Live Commands

This folder is documentation only. The live, invocable Claude Code slash-commands are under `.claude/commands/` (the CLI's own convention — files there become real `/command-name` commands in this repo).

Each command in `.claude/commands/` is a thin wrapper around a playbook in `playbooks/`. To see what's invocable, look at `.claude/commands/`; to see the full procedure a command runs, look at the matching file in `playbooks/`.
