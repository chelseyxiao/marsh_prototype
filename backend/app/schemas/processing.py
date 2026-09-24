from __future__ import annotations

from pydantic import BaseModel


class ProcessingResponse(BaseModel):
    deal_id: str
    status: str
    total_fields: int
    high_confidence_fields: int
    needs_review: int
