"""A lightweight subset of the ``faker`` package used for tests.

This module provides a deterministic data generator that mimics the
subset of the public API required by the backend test-suite.  It is not a
full replacement for the external dependency but offers enough
functionality to avoid importing optional third-party packages when
running the tests in constrained environments.
"""

from __future__ import annotations

import datetime as _dt
import json
import random
import string
import uuid
from dataclasses import dataclass
from typing import Any, Callable, Dict, Optional, Sequence, Tuple

__all__ = ["Faker"]


def _now_date() -> _dt.date:
    return _dt.date.today()


@dataclass
class _GeneratedValue:
    method: str
    args: Tuple[Any, ...]
    kwargs: Tuple[Tuple[str, Any], ...]

    @property
    def key(self) -> Tuple[Any, ...]:
        return (self.method, self.args, self.kwargs)


class _UniqueProxy:
    def __init__(self, faker: "Faker") -> None:
        self._faker = faker
        self._generated: Dict[Tuple[Any, ...], set[Any]] = {}

    def reset(self) -> None:
        self._generated.clear()

    def __getattr__(self, name: str) -> Callable[..., Any]:
        generator = getattr(self._faker, name)

        def wrapper(*args: Any, **kwargs: Any) -> Any:
            key = _GeneratedValue(name, args, tuple(sorted(kwargs.items()))).key
            used = self._generated.setdefault(key, set())
            for _ in range(1024):
                value = generator(*args, **kwargs)
                try:
                    hash(value)
                except TypeError:
                    try:
                        candidate = json.dumps(value, sort_keys=True, default=str)
                    except TypeError:
                        candidate = repr(value)
                else:
                    candidate = value
                if candidate not in used:
                    used.add(candidate)
                    return value
            raise RuntimeError(f"Unable to generate a unique value for {name}")

        return wrapper


class Faker:
    def __init__(self) -> None:
        self.random = random.Random()
        self.unique = _UniqueProxy(self)

    # ------------------------------------------------------------------
    # Utility helpers
    # ------------------------------------------------------------------
    def seed_instance(self, seed: Optional[int] = None) -> None:
        self.random.seed(seed)
        self.unique.reset()

    def random_element(self, elements: Sequence[Any]) -> Any:
        if not elements:
            raise ValueError("Cannot choose from an empty sequence")
        return self.random.choice(list(elements))

    def random_int(self, min: int = 0, max: int = 9999) -> int:
        return self.random.randint(min, max)

    def pybool(self) -> bool:
        return bool(self.random.getrandbits(1))

    def pyfloat(
        self,
        *,
        min_value: float = 0.0,
        max_value: float = 1.0,
        right_digits: int = 2,
    ) -> float:
        value = self.random.uniform(min_value, max_value)
        return round(value, right_digits)

    def pystr(self, *, min_chars: int = 0, max_chars: int = 10) -> str:
        if min_chars > max_chars:
            raise ValueError("min_chars cannot be greater than max_chars")
        length = self.random.randint(min_chars, max_chars)
        return "".join(self.random.choice(string.ascii_letters) for _ in range(length))

    def uuid4(self) -> str:
        return str(uuid.uuid4())

    # ------------------------------------------------------------------
    # Text helpers
    # ------------------------------------------------------------------
    _WORDS: Tuple[str, ...] = (
        "alpha",
        "bravo",
        "charlie",
        "delta",
        "echo",
        "foxtrot",
        "golf",
        "hotel",
        "india",
        "juliet",
        "kilo",
        "lima",
        "mike",
        "november",
        "oscar",
        "papa",
        "quebec",
        "romeo",
        "sierra",
        "tango",
        "uniform",
        "victor",
        "whiskey",
        "xray",
        "yankee",
        "zulu",
    )

    _COMPANY_SUFFIXES: Tuple[str, ...] = ("S.A.", "Ltd.", "Corp.", "Group", "LLC")

    _DOMAINS: Tuple[str, ...] = (
        "example.com",
        "test.io",
        "sample.org",
        "demo.net",
        "local.dev",
    )

    def word(self) -> str:
        return self.random.choice(self._WORDS)

    def sentence(self, nb_words: int = 6) -> str:
        words = [self.word() for _ in range(max(1, nb_words))]
        sentence = " ".join(words)
        return sentence.capitalize() + "."

    def text(self, max_nb_chars: int = 200) -> str:
        words: list[str] = []
        while True:
            word = self.word()
            candidate = " ".join((*words, word)) if words else word
            if len(candidate) > max_nb_chars and words:
                break
            words.append(word)
            if len(" ".join(words)) >= max_nb_chars:
                break
        return " ".join(words)

    def lexify(self, text: str = "????") -> str:
        letters = string.ascii_lowercase
        result = []
        for char in text:
            if char == "?":
                result.append(self.random.choice(letters))
            else:
                result.append(char)
        return "".join(result)

    def bothify(self, text: str = "??##") -> str:
        result = []
        for char in text:
            if char == "?":
                result.append(self.random.choice(string.ascii_uppercase))
            elif char == "#":
                result.append(str(self.random.randint(0, 9)))
            else:
                result.append(char)
        return "".join(result)

    def catch_phrase(self) -> str:
        adjectives = ("Adaptive", "Robust", "Seamless", "Dynamic", "Intuitive")
        nouns = ("Platform", "Solution", "Interface", "Workflow", "Service")
        verbs = ("accelerator", "optimizer", "framework", "suite", "engine")
        return f"{self.random.choice(adjectives)} {self.random.choice(nouns)} {self.random.choice(verbs)}"

    def name(self) -> str:
        first = self.random.choice(self._WORDS).capitalize()
        last = self.random.choice(self._WORDS).capitalize()
        return f"{first} {last}"

    def company(self) -> str:
        base = self.random.choice(self._WORDS).capitalize()
        suffix = self.random.choice(self._COMPANY_SUFFIXES)
        return f"{base} {suffix}"

    def address(self) -> str:
        street = self.word().capitalize()
        city = self.word().capitalize()
        number = self.random.randint(100, 9999)
        return f"{number} {street} St., {city}"

    def phone_number(self) -> str:
        country = self.random.randint(1, 99)
        area = self.random.randint(100, 999)
        prefix = self.random.randint(100, 999)
        line = self.random.randint(1000, 9999)
        return f"+{country} {area}-{prefix}-{line}"

    def email(self) -> str:
        username = self.lexify(text="??????")
        domain = self.random.choice(self._DOMAINS)
        return f"{username}@{domain}"

    def company_email(self) -> str:
        name_part = self.lexify(text="??????")
        domain = self.random.choice(self._DOMAINS)
        return f"{name_part}@{domain}"

    def msisdn(self) -> str:
        digits = [str(self.random.randint(0, 9)) for _ in range(10)]
        return "".join(digits)

    def password(self, length: int = 12) -> str:
        characters = string.ascii_letters + string.digits
        return "".join(self.random.choice(characters) for _ in range(max(1, length)))

    def url(self) -> str:
        domain = self.random.choice(self._DOMAINS)
        path = "/".join(self.lexify(text="???") for _ in range(2))
        return f"https://{domain}/{path}"

    # ------------------------------------------------------------------
    # Date helpers
    # ------------------------------------------------------------------
    def date_between(self, start_date: Any, end_date: Any) -> _dt.date:
        start = self._coerce_date(start_date)
        end = self._coerce_date(end_date)
        if start > end:
            start, end = end, start
        delta_days = (end - start).days
        if delta_days <= 0:
            return start
        offset = self.random.randint(0, delta_days)
        return start + _dt.timedelta(days=offset)

    def _coerce_date(self, value: Any) -> _dt.date:
        if isinstance(value, _dt.date):
            return value
        if isinstance(value, str):
            if value == "today":
                return _now_date()
            if value == "tomorrow":
                return _now_date() + _dt.timedelta(days=1)
            if value == "yesterday":
                return _now_date() - _dt.timedelta(days=1)
            if value.startswith(("+", "-")):
                sign = 1 if value[0] == "+" else -1
                number_part = value[1:-1]
                unit = value[-1]
                if not number_part.isdigit():
                    raise ValueError(f"Invalid relative date: {value}")
                amount = int(number_part)
                if unit == "y":
                    days = amount * 365
                elif unit == "d":
                    days = amount
                else:
                    raise ValueError(f"Unsupported relative unit: {unit}")
                return _now_date() + _dt.timedelta(days=sign * days)
        raise ValueError(f"Unsupported date value: {value}")


__all__ = ["Faker"]
