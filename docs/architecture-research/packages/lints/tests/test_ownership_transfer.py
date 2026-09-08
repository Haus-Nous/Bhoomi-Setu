"""Prove the ownership-transfer invariant fires without false positives."""

from pathlib import Path

from bhoomi_setu_lints.ownership_transfer import CODE, check_source


def test_forbidden_transfer_function_fires() -> None:
    source = "def transfer_ownership(record_id: str) -> None:\n    pass\n"
    violations = check_source(source, Path("service.py"))
    assert [item.code for item in violations] == [CODE]
    assert "Registration Act, 1908 §§17/49" in violations[0].message


def test_evidence_recording_does_not_fire() -> None:
    source = (
        "def record_registered_instrument(record_id: str) -> None:\n"
        '    """Record evidence of an externally registered instrument."""\n'
    )
    assert check_source(source, Path("service.py")) == []
