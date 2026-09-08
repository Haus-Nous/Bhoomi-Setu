"""Forbid floating-point representations of land-record shares."""

import ast
from pathlib import Path

from .model import Violation

CODE = "BS004"
MESSAGE = (
    "Replace the share float with an exact integer numerator/denominator pair and rational "
    "arithmetic. See docs/DOMAIN.md D9 and docs/LEGAL.md Additional engineering invariants."
)


def _contains_float(annotation: ast.expr | None) -> bool:
    if annotation is None:
        return False
    return any(
        (isinstance(node, ast.Name) and node.id in {"float", "Float"})
        or (isinstance(node, ast.Attribute) and node.attr == "Float")
        for node in ast.walk(annotation)
    )


def check_source(source: str, path: Path = Path("<memory>")) -> list[Violation]:
    """Return violations for float-typed share annotations and columns."""
    tree = ast.parse(source)
    violations: list[Violation] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            if "share" in node.target.id.lower() and _contains_float(node.annotation):
                violations.append(Violation(CODE, path, node.lineno, MESSAGE))
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for argument in (*node.args.posonlyargs, *node.args.args, *node.args.kwonlyargs):
                if "share" in argument.arg.lower() and _contains_float(argument.annotation):
                    violations.append(Violation(CODE, path, argument.lineno, MESSAGE))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "Column":
            text = ast.get_source_segment(source, node) or ""
            if "share" in text.lower() and any(
                isinstance(child, ast.Name) and child.id == "Float" for child in ast.walk(node)
            ):
                violations.append(Violation(CODE, path, node.lineno, MESSAGE))
    return violations
