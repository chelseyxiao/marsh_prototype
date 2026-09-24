from __future__ import annotations

from pydantic import BaseModel


class WholesalerSummary(BaseModel):
    wholesaler: str
    total_premium: float
    policy_count: int


class WholesalerAnalysisResponse(BaseModel):
    filename: str
    row_count: int
    valid_premium_rows: int
    invalid_premium_rows: int
    unique_wholesalers: int
    total_premium: float
    top_wholesalers: list[WholesalerSummary]
