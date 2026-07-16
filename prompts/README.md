# prompts/ — Reusable Prompt Fragments

Small, composable prompt fragments for specific reasoning tasks (e.g. a fragment for evaluating trade-offs, a fragment for generating acceptance criteria). Distinct from `playbooks/`: a playbook is a multi-step workflow; a prompt fragment is a single reusable piece of phrasing a playbook or command can pull in.

**When to load:** when authoring or updating a playbook or command that needs a specific piece of reasoning framed consistently.

**When to update:** when a phrasing pattern proves reusable across more than one playbook.

Empty until a second consumer justifies extracting a shared fragment — avoids speculative abstraction.
