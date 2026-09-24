# Objective

Implement a simple end-to-end placeholder workflow in the existing ROCKY POC:

**Upload Excel file → extract brokerage data → calculate Top 5 Wholesalers by Total Premium → display a bar chart in the React UI**

This is a deterministic placeholder only.

Do NOT use Claude, OpenAI, Gemini, OCR, or any LLM for this feature.

---

# 1. Existing Architecture

The project currently has:

```text
ROCKY/
├── frontend/
└── backend/
```

Use:

- React + TypeScript frontend
- FastAPI backend
- Python for Excel processing
- pandas or openpyxl for reading Excel
- existing frontend service layer
- existing FastAPI API structure

Do not redesign the application.

---

# 2. User Experience

On the relevant page, provide a section titled:

**Wholesaler Analysis**

The user should see:

```text
Wholesaler Analysis

Upload brokerage data to identify the largest wholesalers by premium.

[ Choose Excel File ]

Selected:
2025_Brokerage_Data.xlsx

[ Analyze File ]
```

After processing, display:

```text
Top 5 Wholesalers by Total Premium

ARC        ███████████████████   $128,000
RT         ███████               $44,128
Element    █████                 $100,000
...
```

Use a proper horizontal or vertical bar chart rather than manually drawn bars.

Also display a small summary:

```text
20 policies analyzed
5 wholesalers identified
Total premium: $xxx,xxx
```

---

# 3. Expected Excel Structure

The uploaded workbook will contain columns similar to:

```text
Insured
Ex. Date
Coverage
Carrier
Wholesaler
Liab Limit
Premium
Commission
Monthly Premium Totals
BP Pymt
IPFS+misc
```

The important columns for this placeholder are:

```text
Wholesaler
Premium
```

Do not require the other columns for the calculation.

---

# 4. Backend Excel Processing

Create or update an Excel parser under approximately:

```text
backend/app/parsers/excel.py
```

The parser should:

1. Read the first worksheet by default.
2. Read the header row.
3. Normalize column names.
4. Identify the `Wholesaler` column.
5. Identify the `Premium` column.
6. Extract rows containing usable values.
7. Normalize wholesaler names.
8. Convert premium values into numeric values.
9. Aggregate premium by wholesaler.
10. Sort descending.
11. Return the top 5 wholesalers.

Use `pandas` if it is not already installed.

If needed:

```bash
uv add pandas openpyxl
```

Use `openpyxl` as the Excel engine for `.xlsx`.

---

# 5. Column Name Normalization

Column matching should tolerate whitespace and capitalization.

For example:

```text
" Wholesaler "
"wholesaler"
"WHOLESALER"
```

should all normalize to:

```text
wholesaler
```

Similarly:

```text
"Premium "
" PREMIUM"
```

should normalize to:

```text
premium
```

Do not implement fuzzy AI-based column matching yet.

If the required columns cannot be found, return a clear error.

Example:

```json
{
  "detail": "Required column 'Wholesaler' was not found."
}
```

---

# 6. Wholesaler Name Normalization

Clean obvious formatting inconsistencies.

For example:

```text
"ARC"
" ARC"
"ARC "
"ARC "
```

should all become:

```text
ARC
```

Perform:

- strip leading/trailing whitespace
- replace non-breaking spaces with regular spaces
- collapse repeated spaces
- treat empty strings as missing
- preserve the actual wholesaler name otherwise

Do NOT try to infer that differently spelled companies are the same entity.

For example:

```text
ARC
ARC Brokerage
```

should remain separate unless they are exactly equivalent after whitespace cleanup.

---

# 7. Premium Normalization

The Premium column may contain values such as:

```text
$100,000
$13,125
$8,925
$1,700
100000
13,125
```

Convert them to numeric values.

Remove:

```text
$
,
spaces
```

Handle:

- integers
- floats
- Excel numeric cells
- formatted currency strings
- blank values

Blank or invalid premiums should not cause the request to fail.

Skip invalid premium values and include their count in the response if practical.

Do NOT silently convert malformed non-numeric text to zero.

---

# 8. Aggregation Rule

The metric is:

## Top 5 Wholesalers by Total Premium

For every wholesaler:

```text
Total Premium =
sum of Premium across all rows assigned to that wholesaler
```

Example:

```text
ARC
$13,125
$8,925
$2,625
$1,700
...
```

should be aggregated into one ARC total.

Then:

```python
group by Wholesaler
sum Premium
sort descending
take first 5
```

Missing wholesalers should be excluded from the Top 5 calculation.

---

# 9. API Endpoint

Add an endpoint approximately:

```text
POST /api/analytics/wholesalers
```

Accept one Excel file using FastAPI `UploadFile`.

Supported formats for this endpoint:

```text
.xlsx
.xls
```

If `.xls` support requires an additional package and is unnecessary for the current POC, support `.xlsx` first and return a useful error for `.xls`.

Do not permanently save the file.

Read/process the uploaded file and discard it afterward.

---

# 10. API Response

Return structured JSON approximately like:

```json
{
  "filename": "2025_Brokerage_Data.xlsx",
  "row_count": 20,
  "valid_premium_rows": 20,
  "invalid_premium_rows": 0,
  "unique_wholesalers": 3,
  "total_premium": 289403,
  "top_wholesalers": [
    {
      "wholesaler": "ARC",
      "total_premium": 145000,
      "policy_count": 17
    },
    {
      "wholesaler": "Element",
      "total_premium": 100000,
      "policy_count": 1
    },
    {
      "wholesaler": "RT",
      "total_premium": 44128,
      "policy_count": 1
    }
  ]
}
```

Return at most five wholesalers.

If fewer than five exist, return all available wholesalers.

---

# 11. Pydantic Schemas

Create schemas approximately like:

```python
class WholesalerSummary(BaseModel):
    wholesaler: str
    total_premium: float
    policy_count: int


class WholesalerAnalysisResponse(BaseModel):
    filename: str
    row_count: int
    valid_premium_rows: int
    invalid_premium_rows: int
    unique_wholesalers: int
    total_premium: float
    top_wholesalers: list[WholesalerSummary]
```

Do not return pandas-specific objects.

Convert NumPy/pandas numeric types to standard Python types before serialization if necessary.

---

# 12. Backend Structure

Keep business logic out of the route.

Use approximately:

```text
backend/app/
├── api/
│   └── analytics.py
│
├── parsers/
│   └── excel.py
│
├── services/
│   └── wholesaler_analysis_service.py
│
└── schemas/
    └── analytics.py
```

The flow should be:

```text
FastAPI route
    ↓
Excel parser
    ↓
Wholesaler analysis service
    ↓
Pydantic response
```

---

# 13. Frontend Service

Create or update:

```text
frontend/src/services/analyticsService.ts
```

Implement something like:

```typescript
export async function analyzeWholesalers(
  file: File
): Promise<WholesalerAnalysisResponse>
```

Use `FormData`.

Example concept:

```typescript
const formData = new FormData();
formData.append("file", file);

const response = await fetch(
  `${API_BASE_URL}/api/analytics/wholesalers`,
  {
    method: "POST",
    body: formData,
  }
);
```

Do NOT manually set the `Content-Type` header when sending `FormData`.

Allow the browser to set the multipart boundary.

---

# 14. TypeScript Types

Create types approximately like:

```typescript
export interface WholesalerSummary {
  wholesaler: string;
  total_premium: number;
  policy_count: number;
}

export interface WholesalerAnalysisResponse {
  filename: string;
  row_count: number;
  valid_premium_rows: number;
  invalid_premium_rows: number;
  unique_wholesalers: number;
  total_premium: number;
  top_wholesalers: WholesalerSummary[];
}
```

---

# 15. Frontend Chart

Display a bar chart using the charting library already present in the project.

If no chart library exists, use a lightweight library such as:

```text
Recharts
```

Do not install a large visualization framework.

Recommended chart:

**Horizontal bar chart**

Y axis:

```text
Wholesaler
```

X axis:

```text
Total Premium ($)
```

Sort bars from highest to lowest.

Show:

- wholesaler name
- total premium
- formatted dollar tooltip

Example:

```text
ARC         $145,000
Element     $100,000
RT           $44,128
```

Format currency using JavaScript `Intl.NumberFormat`.

---

# 16. Summary Metrics

Above the chart, show three or four compact metrics:

```text
Rows Analyzed
20

Wholesalers
3

Total Premium
$289,403

Top Wholesaler
ARC
```

Avoid excessive dashboard styling.

---

# 17. Loading State

After clicking:

```text
Analyze File
```

show:

```text
Analyzing workbook...
```

Disable the Analyze button until the response returns.

Do not show a fake multi-step AI processing workflow for this placeholder.

---

# 18. Error States

Display clear frontend errors for:

```text
No file selected
Unsupported file type
Missing Wholesaler column
Missing Premium column
Unreadable workbook
Workbook contains no usable records
Backend unavailable
```

Do not use browser `alert()`.

Use the application's existing toast/error UI if available.

---

# 19. No AI Language

For this feature, do not say:

```text
AI analyzed your workbook
AI identified wholesalers
AI generated the chart
```

This feature is ordinary deterministic data processing.

Use wording such as:

```text
Workbook analyzed
Top wholesalers calculated
```

---

# 20. Tests

Add backend tests for:

### Currency parsing

```text
"$100,000" → 100000
"$13,125" → 13125
"869" → 869
blank → ignored
```

### Wholesaler cleanup

```text
" ARC " → "ARC"
"ARC " → "ARC"
```

### Aggregation

Verify multiple ARC rows sum correctly.

### Ranking

Verify results are sorted descending and limited to five.

### Missing columns

Verify appropriate `400` response.

### Upload endpoint

Verify a valid `.xlsx` workbook returns successful analysis.

---

# 21. Important Scope Limitation

Do NOT implement:

- carrier classification
- wholesaler inference
- entity taxonomy
- LLM calls
- AI search
- multiple workbook reconciliation
- arbitrary header detection
- database persistence
- permanent file storage
- Excel output generation

This phase proves only:

```text
Excel upload
    ↓
structured extraction
    ↓
deterministic aggregation
    ↓
Top 5 wholesalers
    ↓
bar chart
```

---

# 22. Acceptance Criteria

The implementation is complete when:

1. React app loads.
2. FastAPI backend runs.
3. User selects an `.xlsx` file.
4. User clicks **Analyze File**.
5. React uploads the workbook to FastAPI.
6. FastAPI successfully reads the workbook.
7. Wholesaler values are normalized.
8. Premium values are converted to numeric amounts.
9. Premium is summed by wholesaler.
10. Results are sorted descending.
11. Top five wholesalers are returned.
12. React renders a bar chart.
13. React renders total premium and row-count metrics.
14. Invalid/missing required columns produce a useful error.
15. Existing application functionality still works.
16. Frontend production build succeeds.
17. Backend tests succeed.

---

# 23. Development Instructions

Before coding:

1. inspect the existing frontend
2. identify the existing chart/component libraries
3. inspect the existing FastAPI structure
4. reuse current styling and service conventions
5. do not restructure unrelated parts of the project

After coding:

1. run backend tests
2. run FastAPI locally
3. run React locally
4. upload a representative workbook
5. confirm calculated values manually
6. confirm chart ordering
7. run frontend production build
8. summarize files created or modified

Do not claim functionality beyond what is implemented.