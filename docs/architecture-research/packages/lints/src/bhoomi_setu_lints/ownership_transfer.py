"""Forbid code paths that directly transfer or rewrite land ownership."""

import ast
import re
from pathlib import Path

from .model import Violation

CODE = "BS001"
MESSAGE = (
    "Remove the ownership-transfer primitive; represent the external instrument and later "
    "administrative update as evidence events routed to a competent authority. See "
    "docs/LEGAL.md §3, Registration Act, 1908 §§17/49."
)
_TRANSFER_NAME = re.compile(
    r"(transfer_(?:owner|ownership|title)|(?:change|replace|set|assign)_owner|"
    r"(?:convey|register|perfect)_title)",
    re.IGNORECASE,
)
_RIGHTS_TABLE = re.compile(r"(?:rights|record_of_rights|ror)", re.IGNORECASE)


def check_source(source: str, path: Path = Path("<memory>")) -> list[Violation]:
    """Return ownership-transfer violations found in one Python source."""
    tree = ast.parse(source)
    violations: list[Violation] = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and _TRANSFER_NAME.search(
            node.name
        ):
            violations.append(Violation(CODE, path, node.lineno, MESSAGE))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            method = node.func.attr
            receiver = ast.unparse(node.func.value)
            if _RIGHTS_TABLE.search(receiver) and re.fullmatch(
                r"(?:set|change|replace|update)_owner", method, re.IGNORECASE
            ):
                violations.append(Violation(CODE, path, node.lineno, MESSAGE))
    return violations
