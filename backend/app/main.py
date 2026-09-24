from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analytics import router as analytics_router
from app.api.deals import router as deals_router
from app.api.documents import router as documents_router
from app.api.health import router as health_router
from app.api.processing import router as processing_router

app = FastAPI(
    title='ROCKY M&A Data Book API',
    version='0.1.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health_router)
app.include_router(deals_router)
app.include_router(documents_router)
app.include_router(processing_router)
app.include_router(analytics_router)


@app.get('/')
def root() -> dict[str, str]:
    return {'status': 'ok', 'service': 'rocky-api'}
