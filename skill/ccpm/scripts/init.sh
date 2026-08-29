#!/usr/bin/env bash
set -euo pipefail

CCPM_ROOT="${CCPM_ROOT:-.ccpm}"

dirs=(prds epics context verify config sessions qa progress rules scripts)

mkdir -p "$CCPM_ROOT"
for d in "${dirs[@]}"; do
  mkdir -p "$CCPM_ROOT/$d"
  [ -f "$CCPM_ROOT/$d/.gitkeep" ] || touch "$CCPM_ROOT/$d/.gitkeep"
done

echo "CCPM initialized at $CCPM_ROOT/"
echo "  Directories: ${dirs[*]}"

# Generate CLAUDE.md if not present (idempotent — skip if file exists)
if [ ! -f "CLAUDE.md" ]; then
  cat > CLAUDE.md << 'CLAUDE_EOF'
# CLAUDE.md

> Think carefully and implement the most concise solution that changes as little code as possible.

## Project-Specific Instructions

Add your project-specific instructions here.

## Testing

Run tests before committing. Check `package.json`, `Makefile`, or `pyproject.toml` for the test command.

## Code Style

Follow existing patterns in the codebase.

## CCPM Workflow

Manage features with CCPM: PRD → Epic → Tasks → Issues → Execute → Verify.
Suggest next steps with `/ccpm <command>` + `[tier/model]` annotation:
- `[medium/sonnet]`: issue-start, issue-complete, status, verify, edit
- `[heavy/opus]`: prd-rethink, prd-new, epic-run, merge, fix-gap

<!-- ccpm:karpathy-section v1 -->
## Karpathy Coding Guidelines

Behavioral guidelines to reduce common LLM coding mistakes.
Full reference: skill `karpathy-coding` (auto-loads on implement/fix/refactor/build/create).

**1. Think Before Coding** — State assumptions explicitly. Present alternatives. Push back when warranted. Ask if unclear — don't assume.

**2. Simplicity First** — Minimum code that solves the problem. No speculative features, abstractions, or configurability. If 200 lines can be 50, rewrite.

**3. Surgical Changes** — Touch only what you must. Don't improve adjacent code, don't refactor things not broken. Every changed line must trace to the user's request.
<!-- /ccpm:karpathy-section -->
CLAUDE_EOF
  echo "CLAUDE.md created with Karpathy Coding Guidelines"
fi

echo ""
echo "Next: Run office-hours or prd-rethink to start planning"
