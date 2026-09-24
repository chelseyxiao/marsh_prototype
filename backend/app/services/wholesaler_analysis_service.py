from __future__ import annotations

from pathlib import Path

from fastapi import UploadFile

from app.parsers.excel import read_wholesaler_analysis
from app.schemas.analytics import WholesalerAnalysisResponse


def analyze_wholesaler_file(file: UploadFile) -> WholesalerAnalysisResponse:
    if file.filename is None:
        raise ValueError('No file selected.')

    suffix = Path(file.filename).suffix.lower()
    if suffix not in {'.xlsx', '.xls'}:
        raise ValueError(f'Unsupported file type: {file.filename}')
    if suffix == '.xls':
        raise ValueError('Unsupported file type: .xls is not supported in this POC. Please upload an .xlsx workbook.')

    contents = file.file.read()
    payload = read_wholesaler_analysis(contents, file.filename)
    return WholesalerAnalysisResponse(**payload)
