#!/usr/bin/env bash
set -euo pipefail

CCPM_ROOT="${CCPM_ROOT:-.ccpm}"

if [ -z "${1:-}" ]; then
  echo "Usage: search.sh <keyword>"
  echo "Searches all .md files in $CCPM_ROOT/"
  exit 1
fi

query="$1"

if [ ! -d "$CCPM_ROOT" ]; then
  echo "No results for '$query' in $CCPM_ROOT/ (directory not found)"
  exit 0
fi

matches=$(grep -rl --include="*.md" -i "$query" "$CCPM_ROOT/" 2>/dev/null || true)

if [ -z "$matches" ]; then
  echo "No results for '$query' in $CCPM_ROOT/"
  exit 0
fi

count=$(echo "$matches" | wc -l | tr -d ' ')
echo "$count file(s) matching '$query':"
echo ""

echo "$matches" | while IFS= read -r f; do
  echo "--- $f"
  grep -n -i -C1 "$query" "$f" 2>/dev/null | head -8
  echo ""
done

exit 0
