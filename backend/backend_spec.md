# ROCKY — FastAPI Backend POC Specification

## Objective

Build the initial FastAPI backend for the existing ROCKY M&A data-book automation POC.

The React frontend already exists under:

/frontend

Create and implement the backend under:

/backend

The backend should support the current frontend workflow:


Create Deal
→ Upload Documents
→ Start Processing
→ Retrieve Results
→ Review Results in Frontend


This is still a POC.

Do NOT implement the production AI pipeline, PostgreSQL, SQLAlchemy, authentication, Google Cloud Storage, Cloud Run deployment, background workers, or billing yet.

Use:

- FastAPI
- Pydantic
- local/in-memory storage
- local temporary file storage
- mock processing results

The code should be designed so these pieces can be replaced later without changing the API contract.



# 1. Existing Project Structure

The current project root is:


ROCKY/
├── frontend/
└── backend/


The frontend must remain intact.

Do not reorganize or rewrite the frontend unless required to connect the service layer to the API.

Inside `/backend`, create approximately:


backend/
│
├── pyproject.toml
├── uv.lock
│
└── app/
    ├── __init__.py
    ├── main.py
    │
    ├── api/
    │   ├── __init__.py
    │   ├── health.py
    │   ├── deals.py
    │   ├── documents.py
    │   └── processing.py
    │
    ├── schemas/
    │   ├── __init__.py
    │   ├── deal.py
    │   ├── document.py
    │   ├── mapping.py
    │   └── processing.py
    │
    ├── services/
    │   ├── __init__.py
    │   ├── deal_service.py
    │   ├── document_service.py
    │   └── processing_service.py
    │
    ├── storage/
    │   ├── __init__.py
    │   └── memory_store.py
    │
    └── core/
        ├── __init__.py
        └── config.py


Do not over-engineer this structure.



# 2. FastAPI Application

Create:


backend/app/main.py


The FastAPI app should include:

python
app = FastAPI(
    title="ROCKY M&A Data Book API",
    version="0.1.0",
)


Add routers from:


health
deals
documents
processing


Enable CORS for local frontend development.

The Vite frontend is expected to run at:


http://localhost:5173


Configure CORS explicitly for that origin.

Do NOT use:

python
allow_origins=["*"]


unless required temporarily for debugging.



# 3. Health Endpoint

Implement:


GET /api/health


Response:

json
{
  "status": "ok",
  "service": "rocky-api"
}


This endpoint should be useful for verifying frontend/backend connectivity.



# 4. Deal Data Model

Create Pydantic schemas for deals.

Use approximately:

python
class DealCreate(BaseModel):
    name: str
    template: str = "marsh"

class DealResponse(BaseModel):
    id: str
    name: str
    template: str
    status: str
    document_count: int
    fields_populated: int
    needs_review: int
    created_at: datetime
    updated_at: datetime


Use proper type hints.

For POC status values, support:


draft
uploaded
processing
review
complete
failed


Prefer an enum or typed literal rather than arbitrary strings.



# 5. Deal Endpoints

Implement:


POST /api/deals
GET /api/deals
GET /api/deals/{deal_id}


### POST /api/deals

Input:

json
{
  "name": "ABC Brokerage Acquisition",
  "template": "marsh"
}


Create a unique ID using UUID.

Return a `DealResponse`.

### GET /api/deals

Return all mock/in-memory deals.

### GET /api/deals/{deal_id}

Return one deal.

If the deal does not exist, return:


404


with a useful error message.



# 6. In-Memory Storage

Create a simple storage abstraction instead of putting dictionaries directly inside API routes.

For now, use an in-memory store.

Example conceptual objects:

python
deals: dict[str, DealRecord]
documents: dict[str, list[DocumentRecord]]
results: dict[str, list[MappingResult]]


Do not persist data across server restarts.

That is acceptable for this phase.

The purpose of the storage abstraction is to make it easy to replace with PostgreSQL later.



# 7. Document Schemas

Create a document schema approximately like:

python
class DocumentResponse(BaseModel):
    id: str
    deal_id: str
    filename: str
    content_type: str | None
    size_bytes: int | None
    status: str


Supported statuses:


uploaded
processing
processed
failed




# 8. Document Upload Endpoint

Implement:


POST /api/deals/{deal_id}/documents


Accept multiple files using:

python
list[UploadFile]


Expected supported file types:


.pdf
.xlsx
.xls
.csv
.docx


Reject obviously unsupported file extensions with a useful `400` response.

For the POC:

- save files locally under `/backend/tmp`
- organize them by deal ID
- do not store file contents in memory
- sanitize filenames
- avoid filename collisions

Example structure:


backend/tmp/
└── {deal_id}/
    ├── FY2025_Financials.xlsx
    ├── Client_Revenue.xlsx
    └── Producer_Report.pdf


After upload:

- create document records
- update deal status to `uploaded`
- update document count

Return metadata for uploaded documents.

Do NOT implement Google Cloud Storage yet.



# 9. Document Listing

Implement:


GET /api/deals/{deal_id}/documents


Return uploaded document metadata for the deal.

This should make it easy for the frontend to display:


filename
file type
status




# 10. Processing Endpoint

Implement:


POST /api/deals/{deal_id}/process


For now, this should NOT call Claude.

Instead:

1. validate that the deal exists
2. validate that at least one document has been uploaded
3. set deal status to `processing`
4. simulate processing
5. generate realistic mock mapping results
6. save those results in the in-memory store
7. set deal status to `review`
8. return a processing response

Do NOT use a long blocking sleep.

Keep the simulated processing fast.



# 11. Processing Response

Create a response schema approximately like:

python
class ProcessingResponse(BaseModel):
    deal_id: str
    status: str
    total_fields: int
    high_confidence_fields: int
    needs_review: int


Example:

json
{
  "deal_id": "123",
  "status": "review",
  "total_fields": 12,
  "high_confidence_fields": 8,
  "needs_review": 4
}




# 12. Mapping Result Model

Create a structured schema approximately like:

python
class SourceEvidence(BaseModel):
    document_id: str | None = None
    document_name: str
    sheet: str | None = None
    page: int | None = None
    row: int | None = None
    original_label: str | None = None
    original_value: str | float | None = None

class MappingResult(BaseModel):
    id: str
    deal_id: str
    section: str
    target_field: str
    proposed_value: str | float | None
    confidence: float
    status: str
    source: SourceEvidence
    rationale: str | None = None
    reviewer_note: str | None = None


Status values:


pending
approved
corrected
rejected
unresolved




# 13. Mock Mapping Results

Generate realistic POC mapping results across sections such as:


Financials
Clients
Carriers
Wholesalers
Producers


At minimum include examples such as:


Total Revenue
Commission Revenue
Contingent Revenue
Other Revenue
Client Count
Carrier Name
Wholesaler Name
Producer Name


Example result:

json
{
  "target_field": "Contingent Revenue",
  "proposed_value": 640382,
  "confidence": 0.71,
  "status": "pending",
  "source": {
    "document_name": "Client Revenue Detail.xlsx",
    "sheet": "Revenue Detail",
    "row": 27,
    "original_label": "Profit Sharing / Contingency Income",
    "original_value": 640382
  },
  "rationale": "Mapped based on the source description and target field definition."
}


Include a mix of:


high confidence >= 0.90
medium confidence 0.75–0.89
low confidence < 0.75




# 14. Results Endpoint

Implement:


GET /api/deals/{deal_id}/results


Return:

python
list[MappingResult]


Support optional filtering by query parameters if simple to add:


section
status


Examples:


GET /api/deals/123/results?section=Financials

GET /api/deals/123/results?status=pending


Do not add unnecessary complexity.



# 15. Human Review Endpoint

Implement:


PATCH /api/mappings/{mapping_id}


Allow the frontend to update:


status
proposed_value
target_field
reviewer_note


Example request:

json
{
  "status": "corrected",
  "proposed_value": 625000,
  "reviewer_note": "Updated based on supporting schedule."
}


Return the updated mapping.

This endpoint is important because the POC review screen already supports:


Accept
Correct
Reject




# 16. Deal Summary Metrics

Whenever mapping results are updated, recalculate the deal's:


fields_populated
needs_review
status


For example:


needs_review =
pending + unresolved


If all mappings are approved/corrected and no unresolved fields remain, deal status can become:


complete


Keep this logic in the service layer, not the API route.



# 17. API Error Handling

Use standard FastAPI `HTTPException`.

At minimum handle:


404 Deal not found
404 Mapping not found
400 No documents uploaded
400 Unsupported file type
422 Invalid request schema


Return clear error messages.

Do not expose Python tracebacks to frontend users.



# 18. Frontend Integration

The React frontend already contains:


frontend/src/services/
    dealService.ts
    documentService.ts
    processingService.ts


Inspect these files before making changes.

Preserve the existing UI.

Replace mock service calls incrementally with real API requests.

Use:


VITE_API_BASE_URL


from a frontend environment variable.

For local development:


VITE_API_BASE_URL=http://localhost:8000


Do not hard-code localhost URLs throughout the frontend.



# 19. Expected Frontend API Flow

Implement the frontend/backend flow as:


POST /api/deals
        ↓
deal_id
        ↓
POST /api/deals/{deal_id}/documents
        ↓
POST /api/deals/{deal_id}/process
        ↓
GET /api/deals/{deal_id}/results
        ↓
Review UI
        ↓
PATCH /api/mappings/{mapping_id}


The existing UI should continue to behave the same visually.



# 20. Do NOT Implement Yet

Do not implement:


Claude API
OpenAI API
Gemini API
PostgreSQL
SQLAlchemy
database migrations
Firebase auth
SSO
multi-tenancy
Google Cloud Storage
Cloud Run
background queues
Celery
Redis
billing
Stripe
SOC 2 controls
real financial parsing
real Excel mapping
real PDF parsing
real Excel export


Do not create unnecessary placeholder frameworks for all of these.

Keep the POC small and understandable.



# 21. Configuration

Create:


backend/app/core/config.py


Use environment variables where appropriate.

At minimum allow configuration for:


FRONTEND_ORIGIN
TEMP_UPLOAD_DIR


Default local values are acceptable.

Do not hard-code secrets.

There should be no secrets required in this phase.



# 22. Temporary Files

Create:


backend/tmp/


Add it to `.gitignore`.

Do not commit uploaded customer documents.

Also ensure that:


.venv
__pycache__
.env


are ignored appropriately.



# 23. Tests

Add a small backend test suite.

Use:


pytest
FastAPI TestClient


At minimum test:


health endpoint
create deal
get deal
404 deal
multiple file upload
unsupported file upload
process deal without documents
process deal with documents
retrieve results
update mapping


Keep tests focused.

Do not build an overly large test framework.



# 24. Development Verification

After implementation, verify:

### Backend

Run:

bash
uv run fastapi dev app/main.py


Confirm:


http://localhost:8000/docs


works.

Confirm:


GET /api/health


returns successfully.

### Frontend

Run the existing frontend.

Confirm that:


Create Deal
Upload Documents
Process
Review
Accept/Correct Mapping


works through the FastAPI backend.



# 25. Quality Requirements

Use:

- Python type hints
- Pydantic models
- small functions
- clear naming
- service-layer separation

Avoid:

- giant route functions
- global business logic inside `main.py`
- duplicate schemas
- unnecessary abstractions
- unnecessary dependencies
- production complexity before it is needed



26. Architectural Principle

Keep this separation:

React UI
    ↓
TypeScript service layer
    ↓
FastAPI routes
    ↓
Python service layer
    ↓
Temporary storage / mock processing

Later we will replace only the bottom layer:

Temporary storage
→ PostgreSQL + Cloud Storage

Mock processing
→ parsers + Claude + deterministic validation

The API contract and React frontend should not need major redesign.

27. Important Product Principle

The purpose of this backend is not to demonstrate sophisticated infrastructure.

It should support the POC workflow:

MESSY SOURCE DOCUMENTS
        ↓
     PROCESS
        ↓
STRUCTURED MAPPINGS
        ↓
EVIDENCE + CONFIDENCE
        ↓
   HUMAN REVIEW

The backend should make the Review UI functional and trustworthy.

28. Final Deliverable

When finished:

summarize the backend files created

summarize any frontend service files modified

explain how to run backend locally

explain how to run frontend locally

identify the API base URL

confirm /docs works

confirm frontend-to-backend communication works

list remaining mocked functionality

do not claim Claude/database/cloud functionality has been implemented
