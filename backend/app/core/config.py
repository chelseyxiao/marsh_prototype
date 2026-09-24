from __future__ import annotations

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')
TEMP_UPLOAD_DIR = Path(os.getenv('TEMP_UPLOAD_DIR', BASE_DIR / 'tmp')).resolve()

TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
