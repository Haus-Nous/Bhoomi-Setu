"""Define common structured output for repository invariant violations."""

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class Violation:
    """Describe one actionable repository invariant violation."""

    code: str
    path: Path
    line: int
    message: str
