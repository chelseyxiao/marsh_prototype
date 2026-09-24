# M&A Data Book Automation — POC UI Specification

## Objective

Build a polished frontend POC for an **insurance brokerage M&A data-book automation application**.

The application should demonstrate the following user workflow:

**Create Deal → Upload Source Documents → Process → Review AI-Mapped Results → Inspect Source Evidence → Correct/Approve Results → Export Completed Data Book**

This is a **frontend POC only**.

Do NOT implement the actual AI pipeline, FastAPI backend, database, authentication, Google Cloud Storage, or Claude API yet.

Use realistic mock data and design the frontend so these services can be connected later without rewriting the UI.

---

# 1. Technology Stack

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui where appropriate
- React Router
- Lucide icons

Do NOT add Redux, Zustand, or other global state-management libraries unless absolutely necessary.

Prefer standard React state and simple reusable components.

Keep dependencies minimal.

The application should run locally with:

```bash
npm install
npm run dev
```

It should also build successfully with:

```bash
npm run build
```

---

# 2. Design Philosophy

The product is intended for users in:

- M&A
- insurance brokerage
- financial analysis
- due diligence
- professional services

The application should look like serious enterprise financial software, not a consumer AI chatbot.

Use:

- white or very light gray backgrounds
- dark navy / charcoal text
- restrained professional accent color
- generous whitespace
- subtle borders
- minimal shadows
- clean typography
- compact but readable tables
- green for approved/high confidence
- amber for needs review
- red only for actual errors

Avoid:

- gradients
- glowing effects
- excessive animation
- chatbot-style interface
- robot icons
- "AI magic" language
- excessive rounded cards
- playful startup aesthetics

The design should feel closer to enterprise diligence, financial-data, or transaction-management software.

---

# 3. Overall Navigation

Use a persistent left sidebar.

Sidebar:

```text
[Product Logo / Name]

Deals
+ New Deal

----------------

Settings
```

The main product name can temporarily be:

**DataBook AI**

Do not spend significant time designing branding.

Within each deal, show a horizontal workflow indicator:

```text
Upload  →  Process  →  Review  →  Export
  ✓          ✓          ●          ○
```

The current stage should be visually clear.

---

# 4. Page 1 — Deals Dashboard

Route:

```text
/deals
```

Purpose:

Allow users to see existing deals and enter a deal workspace.

Header:

```text
Deals                         [+ New Deal]
```

Show a table rather than large cards.

Columns:

- Deal Name
- Status
- Documents
- Fields Populated
- Needs Review
- Last Updated

Example mock data:

```text
ABC Brokerage Acquisition
Status: Review Needed
Documents: 12
Fields Populated: 84%
Needs Review: 8
Last Updated: Sep 9, 2026

XYZ Insurance Brokerage
Status: Complete
Documents: 8
Fields Populated: 100%
Needs Review: 0
Last Updated: Sep 7, 2026

Summit Risk Partners
Status: Processing
Documents: 17
Fields Populated: 63%
Needs Review: —
Last Updated: Sep 9, 2026
```

Status badges:

- Processing
- Review Needed
- Complete
- Draft

Clicking a row should open:

```text
/deals/:dealId
```

---

# 5. Page 2 — Create New Deal

Route:

```text
/deals/new
```

Page title:

**Create New Deal**

Fields:

### Deal Name

Text input.

Example:

```text
ABC Brokerage Acquisition
```

### Target Data Book

Dropdown.

For now only provide:

```text
Marsh M&A Data Book
```

Structure the component so additional templates can be added later.

### Source Documents

Large drag-and-drop upload area.

Supported labels:

- PDF
- XLSX
- XLS
- CSV
- DOCX

Users should be able to select multiple files.

After selection, display uploaded files in a list with:

- filename
- file type
- mock file size
- remove button
- upload status

Example:

```text
✓ FY2025 Financial Statements.xlsx
✓ Client Revenue Detail.xlsx
✓ Producer Report.pdf
✓ Carrier Detail.xlsx
```

Primary CTA:

**Process Documents**

For this frontend POC, clicking the button should:

1. Save the mock deal in frontend state.
2. Navigate to the processing screen.
3. Simulate processing.

Do NOT actually upload files to a server.

---

# 6. Page 3 — Processing Screen

Route:

```text
/deals/:dealId/process
```

The screen should communicate that the system performs a structured workflow.

Do not show a generic spinner by itself.

Show:

```text
Processing Deal

✓ Documents uploaded
✓ Documents classified
✓ Tables extracted
● Mapping fields to data book
○ Validating results
○ Preparing review
```

Include a progress bar.

Simulate progress for demonstration purposes.

Example:

```text
72% Complete

Currently processing:
Client Revenue Detail.xlsx
```

After the mock process finishes, provide:

**Continue to Review**

or automatically navigate after a short delay.

Keep processing logic isolated in a mock service so it can later be replaced by a FastAPI job-status endpoint.

---

# 7. Page 4 — Deal Review

This is the MOST IMPORTANT screen in the POC.

Route:

```text
/deals/:dealId/review
```

Spend the greatest design effort here.

The goal is to demonstrate **human-in-the-loop review of AI-generated mappings**.

## Header

Display:

```text
ABC Brokerage Acquisition

84% populated
8 fields need review
```

Also show the workflow navigation:

```text
Upload ✓     Process ✓     Review ●     Export ○
```

---

# 8. Review Screen Layout

Use a three-part layout:

```text
┌─────────────────┬───────────────────────────────┬──────────────────┐
│ Data Book       │ Mapping Results               │ Evidence Panel   │
│ Sections        │                               │                  │
│                 │                               │                  │
└─────────────────┴───────────────────────────────┴──────────────────┘
```

The evidence panel can appear as a right-side drawer rather than remain permanently visible if screen width is limited.

---

# 9. Data Book Section Navigation

Left column:

```text
Financials
Clients
Carriers
Wholesalers
Producers
```

Show status beside each.

Example:

```text
✓ Financials
⚠ Clients          5
⚠ Carriers         3
✓ Wholesalers
○ Producers
```

Selecting a section changes the main mapping table.

Use mock data for each section.

---

# 10. Mapping Results Table

Main table columns:

- Target Field
- Proposed Value
- Confidence
- Status
- Source
- Action

Example:

| Target Field | Proposed Value | Confidence | Status |
| --- | ---: | ---: | --- |
| Total Revenue | $12,400,000 | 98% | Approved |
| Commission Revenue | $10,800,000 | 94% | Approved |
| Contingent Revenue | $640,382 | 71% | Needs Review |
| Other Revenue | $959,618 | 82% | Needs Review |

Confidence display rules:

```text
>= 90%      High
75%-89%     Medium
< 75%       Low
```

Do not rely only on color.

Also show labels or icons so accessibility is preserved.

Users should be able to filter:

```text
All
Needs Review
Approved
Low Confidence
```

Add a button:

**Approve High Confidence**

For the POC, it can mark all high-confidence results approved in frontend state.

---

# 11. Evidence Panel

When the user clicks a mapping row, open a right-side evidence panel.

Example:

```text
Contingent Revenue

Proposed Value
$640,382

Confidence
71%
Review Recommended

Source
Client Revenue Detail.xlsx

Sheet
Revenue Detail

Row
27

Original Source Label
Profit Sharing / Contingency Income

Original Source Value
$640,382
```

Then show:

### Mapping Rationale

Example:

```text
Mapped to Contingent Revenue because the source description
identifies profit-sharing and contingency-related income.
```

This is mock explanatory text.

Do NOT present the AI rationale as absolute fact.

---

# 12. Human Review Actions

The evidence panel should allow:

### Accept Mapping

Marks the mapping as approved.

### Correct

When clicked, reveal editable controls:

```text
Correct Value
[$640,382]

Target Field
[Contingent Revenue ▼]

Reviewer Note
[Optional note]
```

Button:

**Save Correction**

After saving:

- update frontend state
- change status to "Corrected"
- visually distinguish human-corrected results from AI-approved results

Also provide:

**Reject**

This should mark the item as unresolved.

---

# 13. Source Traceability

Every mapping should preserve:

```typescript
sourceDocument
sourceSheet
sourceRow
sourceLabel
sourceValue
```

Create TypeScript interfaces for these fields.

For the first POC, do NOT build an embedded Excel or PDF viewer.

Instead, show source metadata in the evidence panel.

Optionally include a disabled or mock button:

**View Source**

with a tooltip:

```text
Source document viewer coming in a later version.
```

---

# 14. Export Page

Route:

```text
/deals/:dealId/export
```

Page title:

**Data Book Ready**

Show summary metrics:

```text
94%
Fields Populated

87%
Automatically Approved

13
Fields Manually Reviewed

3
Unresolved Fields
```

Validation section:

```text
✓ Revenue totals reconcile
✓ Client totals reconcile
✓ Carrier classifications reviewed
⚠ 1 unresolved mapping remains
```

Primary CTA:

**Download Completed Data Book**

For the POC, clicking can download a mock file or trigger a placeholder action.

Also include a secondary button:

**Download Review Log**

This can remain mock functionality.

---

# 15. TypeScript Data Models

Create clear interfaces/types.

At minimum:

```typescript
interface Deal {
  id: string;
  name: string;
  template: string;
  status: DealStatus;
  documentCount: number;
  fieldsPopulated: number;
  needsReview: number;
  updatedAt: string;
}

interface DealDocument {
  id: string;
  dealId: string;
  filename: string;
  fileType: string;
  fileSize?: number;
  status: DocumentStatus;
}

interface MappingResult {
  id: string;
  dealId: string;
  section: string;
  targetField: string;
  proposedValue: string | number | null;
  confidence: number;
  status: MappingStatus;

  source: SourceEvidence;

  rationale?: string;
  reviewerNote?: string;
}

interface SourceEvidence {
  documentName: string;
  sheet?: string;
  page?: number;
  row?: number;
  originalLabel?: string;
  originalValue?: string | number;
}
```

Use enums or string unions where helpful.

---

# 16. Service Layer

Do not hard-code API behavior directly into React components.

Create:

```text
src/services/
```

with something like:

```text
dealService.ts
documentService.ts
processingService.ts
```

For now these services should return mock data.

Example:

```typescript
async function getDeal(id: string): Promise<Deal>
```

Later this function should be replaceable with:

```typescript
fetch(`/api/deals/${id}`)
```

without requiring major UI changes.

---

# 17. Suggested Frontend Structure

Use approximately:

```text
src/
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── AppLayout.tsx
│   │
│   ├── deals/
│   │   ├── DealTable.tsx
│   │   ├── DealStatusBadge.tsx
│   │   └── DealWorkflowStepper.tsx
│   │
│   ├── upload/
│   │   ├── FileUploader.tsx
│   │   └── UploadedFileList.tsx
│   │
│   ├── review/
│   │   ├── MappingTable.tsx
│   │   ├── ConfidenceBadge.tsx
│   │   ├── EvidencePanel.tsx
│   │   └── ReviewFilters.tsx
│   │
│   └── common/
│
├── pages/
│   ├── DealsPage.tsx
│   ├── NewDealPage.tsx
│   ├── ProcessingPage.tsx
│   ├── ReviewPage.tsx
│   └── ExportPage.tsx
│
├── services/
│   ├── dealService.ts
│   └── processingService.ts
│
├── data/
│   └── mockData.ts
│
├── types/
│   └── index.ts
│
├── App.tsx
└── main.tsx
```

Do not over-engineer this structure.

---

# 18. Responsive Behavior

Primary target is desktop/laptop.

Optimize for:

```text
1440 × 900
1920 × 1080
```

The application should remain usable at approximately 1024px width.

Mobile support is not a priority for the POC.

For smaller screens:

- collapse the sidebar
- use a drawer for evidence
- allow tables to scroll horizontally

---

# 19. UX Requirements

Every major action should have visual feedback.

Examples:

```text
Uploading...
Processing...
Saved
Approved
Correction saved
```

Disable buttons while actions are processing.

Show empty states.

Example:

```text
No deals yet.

Create your first deal to begin.
```

Show error states for mock failures where appropriate.

Do not use browser `alert()` for normal product interactions.

Use proper toast/messages.

---

# 20. Accessibility

Use semantic HTML.

Buttons should be real buttons.

Inputs should have labels.

Do not communicate confidence or status using color alone.

Support basic keyboard navigation.

---

# 21. What NOT to Implement

Do NOT implement:

- FastAPI
- Claude API
- Gemini API
- OpenAI API
- PostgreSQL
- SQLAlchemy
- Firebase authentication
- Cloud Storage
- Cloud Run
- user accounts
- billing
- subscription management
- multi-tenant permissions
- real Excel processing
- real PDF processing
- background job infrastructure
- embedded document viewer

Use interfaces/placeholders that allow these to be added later.

---

# 22. Important Architectural Rule

The React frontend must never contain future AI/business logic.

Maintain this conceptual separation:

```text
React UI
   ↓
service layer
   ↓
future FastAPI endpoints
   ↓
document / AI / validation logic
```

For now:

```text
React UI
   ↓
service layer
   ↓
mock data
```

The mock service layer should make replacing mock data with API calls straightforward.

---

# 23. Acceptance Criteria

The POC is complete when I can:

1. Open the Deals dashboard.
2. Click New Deal.
3. Enter a deal name.
4. Select multiple mock/source files.
5. Click Process Documents.
6. See a simulated processing workflow.
7. Navigate to the Review screen.
8. Filter results by review status.
9. Select a mapping.
10. See source evidence in a side panel.
11. Accept a mapping.
12. Correct another mapping.
13. See the UI update immediately.
14. Navigate between Financials, Clients, Carriers, Wholesalers, and Producers.
15. Go to Export.
16. See completion/validation metrics.
17. Trigger a mock Data Book download.
18. Refresh/navigate without obvious UI errors.
19. Run `npm run build` without TypeScript/build errors.

---

# 24. Development Approach

Please work incrementally.

First:

1. inspect the existing repository
2. create the basic project structure
3. implement navigation/layout
4. implement mock data
5. build pages one at a time
6. test interactions
7. run lint/type checking
8. run production build

Do not make unrelated changes.

Do not introduce libraries unless they materially simplify the implementation.

After each major stage, verify that the application still runs.

---

# 25. Most Important Product Principle

The POC is NOT trying to prove that an LLM can generate numbers.

The UI should demonstrate a trustworthy workflow:

```text
MESSY SOURCE DOCUMENTS
          ↓
       PROCESS
          ↓
AI-PROPOSED STRUCTURED DATA
          ↓
EVIDENCE + CONFIDENCE
          ↓
      HUMAN REVIEW
          ↓
   COMPLETED DATA BOOK
```

The most important screen is the **Review screen**.

Allocate substantially more UI/UX attention to:

- confidence
- source evidence
- correction
- approval
- unresolved items

than to dashboard aesthetics or branding.

---

# 26. Final Deliverable

When implementation is complete:

- run the application
- resolve TypeScript errors
- resolve build errors
- remove obvious unused code
- provide a concise summary of files created/changed
- explain how to run locally
- identify where the future FastAPI integration should connect
- do not claim backend functionality that has not been implemented