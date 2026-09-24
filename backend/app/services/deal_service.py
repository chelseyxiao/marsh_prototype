from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from app.schemas.deal import DealCreate, DealResponse
from app.storage.memory_store import DealRecord, MemoryStore

store = MemoryStore()


def _deal_to_response(record: DealRecord) -> DealResponse:
    return DealResponse(
        id=record.id,
        name=record.name,
        template=record.template,
        status=record.status,
        document_count=record.document_count,
        fields_populated=record.fields_populated,
        needs_review=record.needs_review,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


def create_deal_record(payload: DealCreate) -> DealResponse:
    deal_id = str(uuid4())
    record = DealRecord(
        id=deal_id,
        name=payload.name,
        template=payload.template,
        status='draft',
        document_count=0,
        fields_populated=0,
        needs_review=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    store.deals[deal_id] = record
    store.documents.setdefault(deal_id, [])
    store.results.setdefault(deal_id, [])
    return _deal_to_response(record)


def get_all_deals() -> list[DealResponse]:
    return [_deal_to_response(record) for record in store.deals.values()]


def get_deal_record(deal_id: str) -> DealResponse | None:
    record = store.deals.get(deal_id)
    if record is None:
        return None
    return _deal_to_response(record)


def get_deal_record_raw(deal_id: str) -> DealRecord | None:
    return store.deals.get(deal_id)


def update_deal_metrics(deal_id: str) -> DealRecord:
    record = store.deals[deal_id]
    results = store.results.get(deal_id, [])
    pending_count = sum(1 for item in results if item.status in {'pending', 'unresolved'})
    approved_count = sum(1 for item in results if item.status in {'approved', 'corrected'})
    record.fields_populated = min(100, max(0, (approved_count * 100) // max(len(results), 1))) if results else 0
    record.needs_review = pending_count
    if not results:
        record.status = 'draft'
    elif pending_count > 0:
        record.status = 'review'
    else:
        record.status = 'complete'
    record.updated_at = datetime.utcnow()
    return record
