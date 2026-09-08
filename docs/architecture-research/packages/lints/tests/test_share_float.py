"""Prove shares reject floats and exact subdivision preserves the whole."""

from fractions import Fraction
from pathlib import Path

from hypothesis import given, settings
from hypothesis import strategies as st

from bhoomi_setu_lints.share_float import CODE, check_source
from bhoomi_setu_lints.share_math import subdivide


def test_float_share_annotation_fires() -> None:
    violations = check_source("def allocate(owner_share: float) -> None: ...\n", Path("types.py"))
    assert [item.code for item in violations] == [CODE]


def test_rational_share_annotation_does_not_fire() -> None:
    source = "def allocate(share_numerator: int, share_denominator: int) -> None: ...\n"
    assert check_source(source, Path("types.py")) == []


@settings(max_examples=500)
@given(st.lists(st.tuples(st.integers(1, 100), st.integers(1, 100)), max_size=30))
def test_random_subdivision_sequences_preserve_exact_total(
    weights: list[tuple[int, int]],
) -> None:
    shares = [Fraction(1, 1)]
    for left_weight, right_weight in weights:
        left, right = subdivide(shares.pop(), left_weight, right_weight)
        shares.extend((left, right))
    assert sum(shares) == Fraction(1, 1)
