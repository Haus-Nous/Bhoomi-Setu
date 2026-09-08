# Continuous project memory

## Current milestone status

- Active milestone: M0 — The harness itself
- Status: durable-memory completion in progress
- Last checkpoint: Session 0.2 domain and legal constraints

## Decisions made and why

- `docs/plans.md` controls scope to prevent drift.
- Demo paths use `fixtures/` without external network for reproducibility.
- Extraction alone may use a GPU.
- Future commands may be loud failing stubs until their owning milestone.

## How to run and demo

- Setup: `just setup`
- Check: `just check`
- Test: `just test`
- List commands: `just`
- Full fixture-only demo: `just demo` after M9 implements it.

## Known issues

- Evaluation and demo commands are stubs until their owning milestones.
- M0 has no user-visible functionality.
- The golden set and metric thresholds begin in M1.
