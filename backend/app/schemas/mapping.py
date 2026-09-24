from __future__ import annotations

from pydantic import BaseModel, Field


class SourceEvidence(BaseModel):
    document_id: str | None = None
    document_name: str
    sheet: str | None = None
    page: int | None = None
    row: int | None = None
    original_label: str | None = None
    original_value: str | float | int | None = None


class MappingResult(BaseModel):
    id: str
    deal_id: str
    section: str
    target_field: str
    proposed_value: str | float | int | None
    confidence: float
    status: str = Field(default='pending')
    source: SourceEvidence
    rationale: str | None = None
    reviewer_note: str | None = None


class MappingUpdate(BaseModel):
    status: str | None = None
    proposed_value: str | float | int | None = None
    target_field: str | None = None
    reviewer_note: str | None = None
