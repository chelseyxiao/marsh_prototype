from __future__ import annotations

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: str
    deal_id: str
    filename: str
    content_type: str | None = None
    size_bytes: int | None = None
    status: str = Field(default='uploaded')
