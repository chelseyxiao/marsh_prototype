from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.analytics import WholesalerAnalysisResponse
from app.services.wholesaler_analysis_service import analyze_wholesaler_file

router = APIRouter(prefix='/api/analytics', tags=['analytics'])


@router.post('/wholesalers', response_model=WholesalerAnalysisResponse)
async def analyze_wholesalers(file: UploadFile = File(...)) -> WholesalerAnalysisResponse:
    try:
        return analyze_wholesaler_file(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
