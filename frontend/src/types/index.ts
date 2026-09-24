export type DealStatus = 'Processing' | 'Review Needed' | 'Complete' | 'Draft'
export type DocumentStatus = 'Uploaded' | 'Processing' | 'Validated'
export type MappingStatus = 'Approved' | 'Needs Review' | 'Corrected' | 'Rejected' | 'Unresolved'

export interface Deal {
  id: string
  name: string
  template: string
  status: DealStatus
  documentCount: number
  fieldsPopulated: number
  needsReview: number
  updatedAt: string
}

export interface DealDocument {
  id: string
  dealId: string
  filename: string
  fileType: string
  fileSize?: number
  status: DocumentStatus
}

export interface SourceEvidence {
  documentName: string
  sheet?: string
  page?: number
  row?: number
  originalLabel?: string
  originalValue?: string | number
}

export interface MappingResult {
  id: string
  dealId: string
  section: string
  targetField: string
  proposedValue: string | number | null
  confidence: number
  status: MappingStatus
  source: SourceEvidence
  rationale?: string
  reviewerNote?: string
}

export interface WholesalerAnalysisRow {
  wholesaler: string
  totalPremium: number
  policyCount: number
}

export interface WholesalerAnalysis {
  policiesAnalyzed: number
  wholesalersIdentified: number
  totalPremium: number
  topWholesalers: WholesalerAnalysisRow[]
}

export interface DealTemplate {
  id: string
  name: string
}
