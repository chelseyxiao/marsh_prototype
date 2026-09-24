from fastapi import APIRouter, HTTPException

from app.schemas.mapping import MappingResult, MappingUpdate
from app.schemas.processing import ProcessingResponse
from app.services.processing_service import get_deal_results, process_deal, update_mapping_result

router = APIRouter(prefix='/api', tags=['processing'])


@router.post('/deals/{deal_id}/process', response_model=ProcessingResponse)
def run_processing(deal_id: str) -> ProcessingResponse:
    try:
        return process_deal(deal_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f'Deal not found: {deal_id}') from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get('/deals/{deal_id}/results', response_model=list[MappingResult])
def get_results(deal_id: str, section: str | None = None, status: str | None = None) -> list[MappingResult]:
    try:
        return get_deal_results(deal_id, section=section, status=status)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f'Deal not found: {deal_id}') from exc


@router.patch('/mappings/{mapping_id}', response_model=MappingResult)
def patch_mapping(mapping_id: str, payload: MappingUpdate) -> MappingResult:
    try:
        return update_mapping_result(mapping_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f'Mapping not found: {mapping_id}') from exc
