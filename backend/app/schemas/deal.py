from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class DealCreate(BaseModel):
    name: str = Field(..., min_length=1)
    template: str = 'marsh'


class DealResponse(BaseModel):
    id: str
    name: str
    template: str
    status: str
    document_count: int
    fields_populated: int
    needs_review: int
    created_at: datetime
    updated_at: datetime
