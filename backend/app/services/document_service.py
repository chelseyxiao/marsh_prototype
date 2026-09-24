from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.schemas.document import DocumentResponse
from app.storage.memory_store import DocumentRecord
from app.services.deal_service import get_deal_record_raw, store

SUPPORTED_EXTENSIONS = {'.pdf', '.xlsx', '.xls', '.csv', '.docx'}


def _sanitize_filename(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    stem = Path(filename).stem
    cleaned = ''.join(ch if ch.isalnum() or ch in {'_', '-', ' '} else '_' for ch in stem)
    return f'{cleaned}{suffix}'


def _deal_dir(deal_id: str) -> Path:
    deal_dir = store.temp_root / deal_id
    deal_dir.mkdir(parents=True, exist_ok=True)
    return deal_dir


def upload_documents_for_deal(deal_id: str, files: list[UploadFile]) -> list[DocumentResponse]:
    deal = get_deal_record_raw(deal_id)
    if deal is None:
        raise KeyError(deal_id)

    if not files:
        raise ValueError('No files uploaded.')

    created: list[DocumentResponse] = []
    saved_docs = store.documents.setdefault(deal_id, [])
    deal_dir = _deal_dir(deal_id)

    for upload in files:
        original_name = upload.filename or 'unnamed_file'
        suffix = Path(original_name).suffix.lower()
        if suffix not in SUPPORTED_EXTENSIONS:
            raise ValueError(f'Unsupported file type: {original_name}')

        sanitized_name = _sanitize_filename(original_name)
        unique_name = sanitized_name
        counter = 1
        while (deal_dir / unique_name).exists():
            unique_name = f'{Path(sanitized_name).stem}_{counter}{Path(sanitized_name).suffix}'
            counter += 1

        contents = upload.file.read()
        save_path = deal_dir / unique_name
        save_path.write_bytes(contents)

        doc_id = str(uuid4())
        record = DocumentRecord(
            id=doc_id,
            deal_id=deal_id,
            filename=unique_name,
            content_type=upload.content_type,
            size_bytes=len(contents),
            status='uploaded',
            storage_path=str(save_path),
        )
        saved_docs.append(record)

        created.append(
            DocumentResponse(
                id=record.id,
                deal_id=record.deal_id,
                filename=record.filename,
                content_type=record.content_type,
                size_bytes=record.size_bytes,
                status=record.status,
            )
        )

    deal.document_count = len(saved_docs)
    deal.status = 'uploaded'
    deal.updated_at = __import__('datetime').datetime.utcnow()
    return created


def get_deal_documents(deal_id: str) -> list[DocumentResponse]:
    deal = get_deal_record_raw(deal_id)
    if deal is None:
        raise KeyError(deal_id)

    docs = store.documents.get(deal_id, [])
    return [
        DocumentResponse(
            id=record.id,
            deal_id=record.deal_id,
            filename=record.filename,
            content_type=record.content_type,
            size_bytes=record.size_bytes,
            status=record.status,
        )
        for record in docs
    ]
