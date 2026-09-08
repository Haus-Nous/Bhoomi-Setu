default:
    @just --list

setup:
    uv sync --all-packages
    pnpm install --frozen-lockfile

bootstrap: setup

format:
    uv run ruff format .
    pnpm format

format-check:
    uv run ruff format --check .
    pnpm format:check

lint:
    uv run ruff check .
    pnpm lint
    just agents-check

typecheck:
    uv run mypy
    pnpm --recursive --if-present run typecheck

build:
    pnpm build

agents-check:
    sh scripts/check-agents-lines.sh

eval:
    @echo "ERROR: just eval is unavailable until milestone M1 implements the evaluation harness." >&2
    @exit 1

eval-fast:
    @echo "ERROR: just eval-fast is unavailable until milestone M1 implements the evaluation harness." >&2
    @exit 1

demo:
    @echo "ERROR: just demo is unavailable until milestone M9 implements the fixture-only demo." >&2
    @exit 1

check: format-check lint typecheck build

test:
    # Pytest exit code 5 means this empty skeleton has no tests yet.
    status=0; uv run pytest || status=$?; test "$status" -eq 0 -o "$status" -eq 5
    pnpm test

infra-up:
    docker compose up -d

infra-down:
    docker compose down

infra-status:
    docker compose ps

infra-logs:
    docker compose logs --follow
