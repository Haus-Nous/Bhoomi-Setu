# Milestone implementation runbook

## Source of truth

`docs/plans.md` is the source of truth milestone by milestone. Work only on the active milestone and its feature IDs. Do not start the next milestone without explicit instruction.

## Execution loop

1. Read the durable memory and active milestone.
2. Confirm the intended diff is scoped to that milestone.
3. Implement the smallest complete vertical slice.
4. Run the milestone's exact validation command.
5. Repair failures immediately and rerun; never batch failures for later.
6. Exercise the fixture-only, network-disabled demo checkpoint.
7. Update `docs/documentation.md` and `docs/PROGRESS.md` continuously.
8. Stop and report; never begin the next milestone automatically.

## Scope discipline

- Keep diffs scoped and never widen scope silently.
- Request a decision when required work lies outside the milestone.
- Preserve unrelated changes and already-correct behavior.
- Record durable decisions once; reopen them only with new evidence.
- Never weaken or skip validation to advance.
