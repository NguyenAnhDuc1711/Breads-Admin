# Init

Bootstrap a project with CCPM directory structure.

## When to Use

- First time setting up CCPM on a project
- After cloning a project that uses CCPM
- To verify/repair `.ccpm/` structure

## Steps

### 1. Run Init Script

```bash
bash skill/ccpm/scripts/init.sh
```

This creates the `.ccpm/` directory tree and generates `CLAUDE.md` at project root (skipped if already present):

```
.ccpm/
  prds/        # Product requirement documents
  epics/       # Epic definitions and task files
  context/     # Runtime context (progress, handoffs, sessions)
  verify/      # Verification state and reports
  config/      # Configuration files
  sessions/    # Debug journals (local-only)
  qa/          # QA scenarios and test results
  progress/    # Progress tracking
```

Each directory includes a `.gitkeep` to preserve structure in git.

`CLAUDE.md` is generated with project-specific instructions placeholder + CCPM workflow blurb + Karpathy Coding Guidelines (3 principles). If `CLAUDE.md` already exists, it is not overwritten.

### 2. Verify

Confirm the structure exists:

```bash
ls -la .ccpm/
```

All 8 subdirectories should be present.

### 3. Next Steps

- **New project?** Run `ctx-create` to establish project context documentation
- **Have a vague idea?** Run `office-hours` to brainstorm
- **Ready to plan?** Run `prd-rethink` to shape a product brief
- **Have a PRD?** Run `team-build` to go from PRD to executing tasks

## claude-md-refresh

Append Karpathy Coding Guidelines to an existing `CLAUDE.md`. Use this if the project already had `CLAUDE.md` before CCPM was installed, or to migrate from an older CCPM version.

```bash
bash skill/ccpm/scripts/claude-md-refresh.sh
# or with --project-dir for a non-cwd project:
bash skill/ccpm/scripts/claude-md-refresh.sh --project-dir /path/to/project
```

Idempotent — skips if marker `<!-- ccpm:karpathy-section v1 -->` already present. Creates `CLAUDE.md.bak` before any modification.

## Custom Root

To use a different directory instead of `.ccpm/`:

```bash
CCPM_ROOT=my-custom-dir bash skill/ccpm/scripts/init.sh
```

All CCPM scripts respect the `CCPM_ROOT` environment variable.

## Conventions

All managed files use YAML frontmatter. See [conventions.md](conventions.md) for format details.
