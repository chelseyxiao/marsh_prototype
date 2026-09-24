from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


@dataclass
class DealRecord:
    id: str
    name: str
    template: str
    status: str = 'draft'
    document_count: int = 0
    fields_populated: int = 0
    needs_review: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DocumentRecord:
    id: str
    deal_id: str
    filename: str
    content_type: str | None
    size_bytes: int | None
    status: str = 'uploaded'
    storage_path: str | None = None


@dataclass
class MappingRecord:
    id: str
    deal_id: str
    section: str
    target_field: str
    proposed_value: str | float | int | None
    confidence: float
    source: dict
    status: str = 'pending'
    rationale: str | None = None
    reviewer_note: str | None = None


class MemoryStore:
    def __init__(self) -> None:
        self.deals: dict[str, DealRecord] = {}
        self.documents: dict[str, list[DocumentRecord]] = {}
        self.results: dict[str, list[MappingRecord]] = {}
        self.temp_root: Path = Path(__file__).resolve().parents[2] / 'tmp'
        self.temp_root.mkdir(parents=True, exist_ok=True)
