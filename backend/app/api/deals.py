from fastapi import APIRouter, HTTPException

from app.schemas.deal import DealCreate, DealResponse
from app.services.deal_service import create_deal_record, get_all_deals, get_deal_record

router = APIRouter(prefix='/api/deals', tags=['deals'])


@router.post('', response_model=DealResponse)
def create_deal(payload: DealCreate) -> DealResponse:
    return create_deal_record(payload)


@router.get('', response_model=list[DealResponse])
def list_deals() -> list[DealResponse]:
    return get_all_deals()


@router.get('/{deal_id}', response_model=DealResponse)
def get_deal(deal_id: str) -> DealResponse:
    deal = get_deal_record(deal_id)
    if deal is None:
        raise HTTPException(status_code=404, detail=f'Deal not found: {deal_id}')
    return deal
