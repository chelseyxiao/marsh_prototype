from __future__ import annotations

import re
from io import BytesIO
from typing import Any

import pandas as pd


def normalize_column_name(value: Any) -> str:
    if value is None or pd.isna(value):
        return ''
    text = str(value).replace('\xa0', ' ').strip()
    text = re.sub(r'\s+', ' ', text)
    return text.lower()


def normalize_wholesaler_name(value: Any) -> str | None:
    if value is None or pd.isna(value):
        return None
    text = str(value).replace('\xa0', ' ').strip()
    text = re.sub(r'\s+', ' ', text)
    if not text:
        return None
    return text


def normalize_premium_value(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)

    text = str(value).replace('\xa0', ' ').strip()
    if not text:
        return None

    cleaned = text.replace('$', '').replace(',', '').replace(' ', '').replace('(', '-').replace(')', '')
    try:
        return float(cleaned)
    except ValueError:
        return None


def read_wholesaler_analysis(file_bytes: bytes, filename: str) -> dict[str, Any]:
    workbook = pd.read_excel(BytesIO(file_bytes), engine='openpyxl')

    if workbook.empty:
        raise ValueError("Required column 'Wholesaler' was not found.")

    normalized_columns = {normalize_column_name(column): column for column in workbook.columns}
    wholesaler_column = normalized_columns.get('wholesaler')
    premium_column = normalized_columns.get('premium')

    if wholesaler_column is None:
        raise ValueError("Required column 'Wholesaler' was not found.")
    if premium_column is None:
        raise ValueError("Required column 'Premium' was not found.")

    totals: dict[str, float] = {}
    policy_count_by_wholesaler: dict[str, int] = {}
    valid_premium_rows = 0
    invalid_premium_rows = 0

    for _, row in workbook.iterrows():
        wholesaler = normalize_wholesaler_name(row[wholesaler_column])
        premium = normalize_premium_value(row[premium_column])

        if premium is None:
            invalid_premium_rows += 1
            continue

        if wholesaler is None:
            continue

        valid_premium_rows += 1
        totals[wholesaler] = totals.get(wholesaler, 0.0) + premium
        policy_count_by_wholesaler[wholesaler] = policy_count_by_wholesaler.get(wholesaler, 0) + 1

    sorted_results = sorted(totals.items(), key=lambda item: (-item[1], item[0]))
    top_wholesalers = [
        {
            'wholesaler': wholesaler,
            'total_premium': float(total),
            'policy_count': policy_count_by_wholesaler.get(wholesaler, 0),
        }
        for wholesaler, total in sorted_results[:5]
    ]

    return {
        'filename': filename,
        'row_count': len(workbook),
        'valid_premium_rows': valid_premium_rows,
        'invalid_premium_rows': invalid_premium_rows,
        'unique_wholesalers': len(totals),
        'total_premium': float(sum(totals.values())),
        'top_wholesalers': top_wholesalers,
    }
