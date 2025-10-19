"""Utility helpers for PurchasesAndSuppliers tests."""

from __future__ import annotations


def csv_safe(value: str) -> str:
    """Return a CSV-safe representation without commas or newlines."""

    return str(value).replace(",", " ").replace("\n", " ").replace("\r", " ")
