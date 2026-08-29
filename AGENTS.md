<!-- CCPM:START -->
# CCPM — Project Manager

Spec-driven development workflows. When the user invokes a `/ccpm:` or `/pm:` command, read `skill/ccpm/SKILL.md` and route to the matching reference doc.

## Commands

| Command | Reference | Purpose |
|---------|-----------|---------|
| `init` | skill/ccpm/references/init.md | Bootstrap `.ccpm/` directories and config |
| `ctx-create` | skill/ccpm/references/context.md | Create initial project context docs |
| `ctx-prime` | skill/ccpm/references/context.md | Load context for new session |
| `ctx-update` | skill/ccpm/references/context.md | Update context to reflect current state |
| `office-hours` | skill/ccpm/references/plan.md | Collaborative brainstorming session |
| `prd-rethink` | skill/ccpm/references/plan.md | Challenge premises, find 10-star product |
| `prd-new` | skill/ccpm/references/prd.md | Write a new PRD via guided discovery |
| `prd-validate` | skill/ccpm/references/prd.md | Validate PRD completeness and coherence |
| `prd-qualify` | skill/ccpm/references/prd.md | Validate/edit loop until PRD passes |
| `prd-edit` | skill/ccpm/references/prd.md | Edit existing PRD with impact analysis |
| `prd-design` | skill/ccpm/references/design.md | Design system, mockups, implementation specs |
| `team-build` | skill/ccpm/references/doc.md | Full doc pipeline: PRD to epic |
| `epic-run` | skill/ccpm/references/execute.md | Epic autopilot — plan, execute, verify tasks |
| `epic-verify` | skill/ccpm/references/verify.md | Verification pipeline — semantic + integration |
| `epic-merge` | skill/ccpm/references/merge.md | Merge epic branch + cleanup |
| `issue-new` | skill/ccpm/references/work.md | Create a new issue |
| `issue-start` | skill/ccpm/references/work.md | Start work on an issue |
| `issue-complete` | skill/ccpm/references/work.md | Complete work on an issue |
| `qa:scenario-new` | skill/ccpm/references/qa.md | Create QA test scenario |
| `qa:run` | skill/ccpm/references/qa.md | Run QA test suite |

## Conventions

Read `skill/ccpm/references/conventions.md` for frontmatter format, git branch naming, commit format, and path conventions.

## Runtime Data

All workflow state is stored in `.ccpm/` (prds, epics, context, verify, config, sessions, qa, progress). Never write to `.claude/`.
<!-- CCPM:END -->
