from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.document import DocumentResponse
from app.services.document_service import get_deal_documents, upload_documents_for_deal

router = APIRouter(prefix='/api/deals', tags=['documents'])


@router.post('/{deal_id}/documents', response_model=list[DocumentResponse])
async def upload_documents(
    deal_id: str,
    files: Annotated[list[UploadFile], File(...)],
) -> list[DocumentResponse]:
    try:
        return upload_documents_for_deal(deal_id, files)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f'Deal not found: {deal_id}') from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get('/{deal_id}/documents', response_model=list[DocumentResponse])
def list_documents(deal_id: str) -> list[DocumentResponse]:
    try:
        return get_deal_documents(deal_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f'Deal not found: {deal_id}') from exc
