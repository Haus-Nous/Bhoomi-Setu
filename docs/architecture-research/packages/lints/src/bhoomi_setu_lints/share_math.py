"""Provide exact share subdivision used by invariant property tests."""

from fractions import Fraction


def subdivide(share: Fraction, left_weight: int, right_weight: int) -> tuple[Fraction, Fraction]:
    """Split a share exactly according to two positive integer weights."""
    total = left_weight + right_weight
    return share * Fraction(left_weight, total), share * Fraction(right_weight, total)
