<!-- CCPM:START -->
# CCPM — Project Manager

Spec-driven development workflows. When the user invokes a `/ccpm:` or `/pm:` command, read the skill entry point and route to the matching reference doc.

## Skill Entry Point

@skill/ccpm/SKILL.md

## Conventions

@skill/ccpm/references/conventions.md

## Runtime Data

All workflow state is stored in `.ccpm/` (prds, epics, context, verify, config, sessions, qa, progress). Never write to `.claude/`.
<!-- CCPM:END -->
