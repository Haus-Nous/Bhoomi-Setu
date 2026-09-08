# Bhoomi Setu Agent Guide

Bhoomi Setu's durable project memory lives in the files linked below.
This file is a compact table of contents, not a replacement for them.

## Start Here

- [Project prompt](docs/prompt.md)
- [Plans](docs/plans.md)
- [Implementation guidance](docs/implement.md)
- [Documentation guidance](docs/documentation.md)
- [Current progress](docs/PROGRESS.md)
- [Architecture](ARCHITECTURE.md)

## Durable Domain Memory

- [Domain model](docs/DOMAIN.md)
- [Legal and policy constraints](docs/LEGAL.md)
- [Spatial and geospatial concerns](docs/SPATIAL.md)
- [Security and privacy](docs/SECURITY.md)
- [Product copy and terminology](docs/COPY.md)
- [Quality requirements](docs/QUALITY.md)
- [Demo plan](docs/DEMO.md)

## Repository Areas

- `services/`: Python service boundaries
- `packages/domain-types/`: dependency-free domain types with no I/O
- `packages/rules/`: YAML rule packs and rule evaluation
- `packages/lints/`: Bhoomi Setu repository checks
- `apps/`: browser applications
- `fixtures/`: golden, synthetic, and adapter fixtures
- `docs/`: durable project memory

## Working Rules

- Treat the linked durable-memory files as the system of record.
- Do not create competing documentation for the same subject.
- Use `just` as the repository command surface.
- Keep `packages/domain-types` free of runtime dependencies and I/O.
- Never place real personal or land-record data in fixtures.
- Update the relevant durable-memory file when its subject changes.
- Run `just setup && just check && just test` before handoff.

## Maintaining This File

Keep this file at or below 120 physical lines.
Put detailed guidance in the appropriate durable-memory file and link it here.
CI enforces the limit through `just agents-check`.

