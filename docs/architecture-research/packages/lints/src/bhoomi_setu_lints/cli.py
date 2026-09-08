"""Run all Bhoomi Setu invariant checks against repository source."""

import sys
from pathlib import Path

from .ownership_transfer import check_source
from .share_float import check_source as check_share_float


def main() -> int:
    """Print actionable violations and return a failing status when any exist."""
    root = Path.cwd()
    violations = []
    for base in (root / "services", root / "packages"):
        for path in base.rglob("*.py"):
            if ".venv" in path.parts or ("packages", "lints", "tests") == path.parts[-3:]:
                continue
            source = path.read_text(encoding="utf-8")
            relative_path = path.relative_to(root)
            violations.extend(check_source(source, relative_path))
            violations.extend(check_share_float(source, relative_path))
    for item in violations:
        print(f"{item.path}:{item.line}: {item.code} {item.message}", file=sys.stderr)
    return 1 if violations else 0


if __name__ == "__main__":
    raise SystemExit(main())
