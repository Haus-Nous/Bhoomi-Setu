#!/bin/sh
set -eu
line_count=$(wc -l < AGENTS.md)
if [ "$line_count" -gt 120 ]; then
  echo "AGENTS.md has $line_count lines; maximum is 120." >&2
  exit 1
fi
for path in ARCHITECTURE.md docs/prompt.md docs/plans.md docs/implement.md docs/documentation.md docs/PROGRESS.md docs/DOMAIN.md docs/LEGAL.md docs/SPATIAL.md docs/SECURITY.md docs/COPY.md docs/QUALITY.md docs/DEMO.md
do
  test -f "$path" || { echo "Missing AGENTS.md target: $path" >&2; exit 1; }
done

