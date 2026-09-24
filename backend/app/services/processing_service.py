from __future__ import annotations

from datetime import datetime

from app.schemas.mapping import MappingResult, MappingUpdate, SourceEvidence
from app.schemas.processing import ProcessingResponse
from app.services.deal_service import get_deal_record_raw, store, update_deal_metrics


MOCK_MAPPINGS = [
    ('Financials', 'Total Revenue', 0.98, 'approved', '$12,400,000', 'Revenue summary from the financial statements.'),
    ('Financials', 'Commission Revenue', 0.94, 'approved', '$10,800,000', 'Commission income line item mapped from revenue detail.'),
    ('Financials', 'Contingent Revenue', 0.71, 'pending', '$640,382', 'Needs review due to profit-sharing classification.'),
    ('Financials', 'Other Revenue', 0.82, 'pending', '$959,618', 'Other operating income requires review.'),
    ('Clients', 'Client Count', 0.91, 'approved', 46, 'Client roster count validated.'),
    ('Clients', 'Top Client Concentration', 0.83, 'pending', '34.8%', 'Concentration ratio needs confirmation.'),
    ('Carriers', 'Carrier Name', 0.95, 'approved', 'AIG', 'Carrier roster match confirmed.'),
    ('Wholesalers', 'Wholesaler Name', 0.88, 'corrected', 'Allied', 'Matched to wholesaler list with minor adjustment.'),
    ('Producers', 'Producer Name', 0.77, 'pending', 'K. Smith', 'Producer name extracted with moderate confidence.'),
]


def _build_mapping_result(deal_id: str, index: int, section: str, target_field: str, confidence: float, status: str, proposed_value: str | int | float, rationale: str) -> MappingResult:
    return MappingResult(
        id=f'map-{deal_id[:8]}-{index}',
        deal_id=deal_id,
        section=section,
        target_field=target_field,
        proposed_value=proposed_value,
        confidence=confidence,
        status=status,
        source=SourceEvidence(
            document_id=None,
            document_name='Client Revenue Detail.xlsx',
            sheet='Revenue Detail',
            row=27 + index,
            original_label=target_field,
            original_value=proposed_value,
        ),
        rationale=rationale,
    )


def process_deal(deal_id: str) -> ProcessingResponse:
    deal = get_deal_record_raw(deal_id)
    if deal is None:
        raise KeyError(deal_id)

    docs = store.documents.get(deal_id, [])
    if not docs:
        raise ValueError('No documents uploaded for this deal.')

    deal.status = 'processing'
    deal.updated_at = datetime.utcnow()

    mapping_results = [
        _build_mapping_result(deal_id, index, section, target_field, confidence, status, value, rationale)
        for index, (section, target_field, confidence, status, value, rationale) in enumerate(MOCK_MAPPINGS)
    ]
    store.results[deal_id] = mapping_results

    update_deal_metrics(deal_id)
    deal.status = 'review'
    deal.updated_at = datetime.utcnow()

    high_confidence = sum(1 for result in mapping_results if result.confidence >= 0.90)
    return ProcessingResponse(
        deal_id=deal_id,
        status='review',
        total_fields=len(mapping_results),
        high_confidence_fields=high_confidence,
        needs_review=sum(1 for item in mapping_results if item.status in {'pending', 'unresolved'}),
    )


def get_deal_results(deal_id: str, section: str | None = None, status: str | None = None) -> list[MappingResult]:
    deal = get_deal_record_raw(deal_id)
    if deal is None:
        raise KeyError(deal_id)

    results = store.results.get(deal_id, [])
    if section is not None:
        results = [item for item in results if item.section.lower() == section.lower()]
    if status is not None:
        results = [item for item in results if item.status.lower() == status.lower()]
    return [MappingResult(**item.model_dump()) for item in results]


def update_mapping_result(mapping_id: str, payload: MappingUpdate) -> MappingResult:
    for deal_id, results in store.results.items():
        for result in results:
            if result.id == mapping_id:
                if payload.status is not None:
                    result.status = payload.status
                if payload.proposed_value is not None:
                    result.proposed_value = payload.proposed_value
                if payload.target_field is not None:
                    result.target_field = payload.target_field
                if payload.reviewer_note is not None:
                    result.reviewer_note = payload.reviewer_note
                update_deal_metrics(deal_id)
                return MappingResult(**result.model_dump())
    raise KeyError(mapping_id)
