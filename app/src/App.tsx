import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Download,
  FileText,
  FolderPlus,
  LayoutGrid,
  Plus,
  Settings,
  Upload,
  X,
} from 'lucide-react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { mockDeals, sectionNames, sectionStatuses } from './data/mockData'
import { getDeal, getDealDocuments, getDealMappings, getDeals } from './services/dealService'
import { formatBytes } from './services/documentService'
import { simulateProcessing } from './services/processingService'
import type { Deal, MappingResult } from './types'
import './App.css'

const workflowStages = ['Upload', 'Process', 'Review', 'Export']

function StatusBadge({ status }: { status: string }) {
  const className =
    status === 'Processing'
      ? 'status-processing'
      : status === 'Review Needed'
        ? 'status-review'
        : status === 'Complete'
          ? 'status-complete'
          : status === 'Draft'
            ? 'status-draft'
            : status === 'Approved'
              ? 'status-approved'
              : status === 'Needs Review' || status === 'Unresolved'
                ? 'status-needs-review'
                : status === 'Corrected'
                  ? 'status-corrected'
                  : status === 'Rejected'
                    ? 'status-rejected'
                    : 'status-draft'

  return <span className={`status-badge ${className}`}>{status}</span>
}

function getConfidenceStyle(confidence: number) {
  if (confidence >= 90) return 'confidence-high'
  if (confidence >= 75) return 'confidence-medium'
  return 'confidence-low'
}

function getConfidenceLabel(confidence: number) {
  if (confidence >= 90) return 'High'
  if (confidence >= 75) return 'Medium'
  return 'Low'
}

function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="flex h-full flex-col p-4">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
            D
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">DataBook AI</div>
          </div>
        </div>

        <nav className="space-y-2">
          <div className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Deals
          </div>
          <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
            <span className="flex items-center gap-2">
              <LayoutGrid size={15} />
              Deals
            </span>
          </button>
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            <Plus size={15} />
            New Deal
          </button>
        </nav>

        <div className="mt-auto pt-6">
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            <Settings size={15} />
            Settings
          </button>
        </div>
      </div>
    </aside>
  )
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function DealTable() {
  const navigate = useNavigate()
  const [deals, setDeals] = useState<Deal[]>([])

  useEffect(() => {
    getDeals().then(setDeals)
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-slate-900">Deals</h1>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          onClick={() => navigate('/deals/new')}
        >
          <Plus size={15} />
          New Deal
        </button>
      </div>

      <table className="w-full border-collapse text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-6 py-3 font-medium">Deal Name</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 font-medium">Documents</th>
            <th className="px-6 py-3 font-medium">Fields Populated</th>
            <th className="px-6 py-3 font-medium">Needs Review</th>
            <th className="px-6 py-3 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr
              key={deal.id}
              className="cursor-pointer border-t border-slate-200 transition hover:bg-slate-50"
              onClick={() => navigate(`/deals/${deal.id}/review`)}
            >
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{deal.name}</td>
              <td className="px-6 py-4">
                <StatusBadge status={deal.status} />
              </td>
              <td className="px-6 py-4 text-sm text-slate-700">{deal.documentCount}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{deal.fieldsPopulated}%</td>
              <td className="px-6 py-4 text-sm text-slate-700">{deal.needsReview ? deal.needsReview : '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{deal.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NewDealPage() {
  const navigate = useNavigate()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    setSelectedFiles((prev) => [...prev, ...Array.from(files)])
  }

  const handleCreateDeal = () => {
    const newDeal: Deal = {
      id: 'abc-brokerage-acquisition',
      name: 'ABC Brokerage Acquisition',
      template: 'Marsh M&A Data Book',
      status: 'Review Needed',
      documentCount: selectedFiles.length || 4,
      fieldsPopulated: 84,
      needsReview: 8,
      updatedAt: 'Sep 9, 2026',
    }

    mockDeals.unshift(newDeal)
    navigate(`/deals/${newDeal.id}/process`)
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-3xl font-semibold text-slate-900">Create New Deal</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Deal Name</label>
              <input
                defaultValue="ABC Brokerage Acquisition"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none ring-0 focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Target Data Book</label>
              <div className="relative">
                <select className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 pr-10 text-slate-900 outline-none focus:border-slate-400">
                  <option>Marsh M&A Data Book</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-500" size={18} />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Source Documents</label>
            <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100">
              <Upload size={28} className="mb-4 text-slate-500" />
              <div className="mb-2 text-base font-medium text-slate-800">Drag & drop files here</div>
              <div className="mb-3 text-sm text-slate-500">PDF, XLSX, XLS, CSV, DOCX</div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />
              <span className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                Select files
              </span>
            </label>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-medium text-slate-700">Uploaded files</div>
            <ul className="space-y-3">
              {selectedFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-500" />
                    <div>
                      <div className="text-sm font-medium text-slate-800">{file.name}</div>
                      <div className="text-xs text-slate-500">{file.type || 'FILE'} • {formatBytes(file.size)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-emerald-700">✓</span>
                    <button
                      className="text-slate-400 hover:text-slate-600"
                      onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index))}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleCreateDeal}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Process Documents
          </button>
        </div>
      </div>
    </div>
  )
}

function ProcessingPage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Documents uploaded')

  useEffect(() => {
    simulateProcessing((nextProgress, message) => {
      setProgress(nextProgress)
      setCurrentStep(message)
    }).then(() => navigate('/deals/abc-brokerage-acquisition/review'))
  }, [navigate])

  const steps = [
    'Documents uploaded',
    'Documents classified',
    'Tables extracted',
    'Mapping fields to data book',
    'Validating results',
    'Preparing review',
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-8">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-3xl font-semibold text-slate-900">Processing Deal</h1>

        <div className="space-y-5">
          {steps.map((step, index) => {
            const completed = index < steps.indexOf(currentStep) || progress >= (index + 1) * 20
            const active = step === currentStep
            return (
              <div key={step} className="flex items-center gap-3 text-sm">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    completed
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : active
                        ? 'border-slate-500 bg-slate-100 text-slate-700'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {completed ? <Check size={14} /> : index === steps.indexOf(currentStep) ? <Circle size={10} fill="currentColor" /> : '○'}
                </div>
                <span className={completed || active ? 'text-slate-800' : 'text-slate-400'}>{step}</span>
              </div>
            )
          })}
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>{progress}% Complete</span>
            <span>Currently processing: Client Revenue Detail.xlsx</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200">
            <div className="h-2.5 rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/deals/abc-brokerage-acquisition/review')}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Continue to Review
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewPage() {
  const { dealId = 'abc-brokerage-acquisition' } = useParams()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [mappings, setMappings] = useState<MappingResult[]>([])
  const [selectedSection, setSelectedSection] = useState('Financials')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedMapping, setSelectedMapping] = useState<MappingResult | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [correctValue, setCorrectValue] = useState('')
  const [targetField, setTargetField] = useState('Contingent Revenue')
  const [reviewerNote, setReviewerNote] = useState('')

  useEffect(() => {
    getDeal(dealId).then(setDeal)
    getDealDocuments(dealId)
    getDealMappings(dealId).then((data) => {
      setMappings(data)
      setSelectedMapping(data.find((item) => item.section === 'Financials') ?? data[0] ?? null)
    })
  }, [dealId])

  const visibleMappings = useMemo(() => {
    const filtered = mappings.filter((mapping) => {
      if (selectedSection !== 'All' && mapping.section !== selectedSection) return false
      if (selectedFilter === 'Needs Review') return mapping.status === 'Needs Review'
      if (selectedFilter === 'Approved') return mapping.status === 'Approved'
      if (selectedFilter === 'Low Confidence') return mapping.confidence < 75
      return true
    })

    return filtered.length ? filtered : mappings.filter((mapping) => mapping.section === selectedSection)
  }, [mappings, selectedSection, selectedFilter])

  const currentDeal = deal ?? mockDeals[0]

  const approveHighConfidence = () => {
    setMappings((prev) =>
      prev.map((mapping) =>
        mapping.confidence >= 90 && mapping.status !== 'Approved'
          ? { ...mapping, status: 'Approved' }
          : mapping,
      ),
    )
  }

  const acceptMapping = () => {
    setMappings((prev) =>
      prev.map((mapping) =>
        mapping.id === selectedMapping?.id ? { ...mapping, status: 'Approved' } : mapping,
      ),
    )
    if (selectedMapping) setSelectedMapping({ ...selectedMapping, status: 'Approved' })
  }

  const rejectMapping = () => {
    setMappings((prev) =>
      prev.map((mapping) =>
        mapping.id === selectedMapping?.id ? { ...mapping, status: 'Rejected' } : mapping,
      ),
    )
    if (selectedMapping) setSelectedMapping({ ...selectedMapping, status: 'Rejected' })
  }

  const saveCorrection = () => {
    setMappings((prev) =>
      prev.map((mapping) =>
        mapping.id === selectedMapping?.id
          ? {
              ...mapping,
              proposedValue: correctValue || mapping.proposedValue,
              targetField: targetField || mapping.targetField,
              reviewerNote: reviewerNote || mapping.reviewerNote,
              status: 'Corrected',
            }
          : mapping,
      ),
    )
    if (selectedMapping) {
      setSelectedMapping({
        ...selectedMapping,
        proposedValue: correctValue || selectedMapping.proposedValue,
        targetField: targetField || selectedMapping.targetField,
        reviewerNote: reviewerNote || selectedMapping.reviewerNote,
        status: 'Corrected',
      })
    }
    setIsEditing(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{currentDeal.name}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
              <span>{currentDeal.fieldsPopulated}% populated</span>
              <span>{currentDeal.needsReview} fields need review</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            {workflowStages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-2">
                <span className={index < 2 ? 'text-slate-900' : 'text-slate-400'}>{stage}</span>
                {index < workflowStages.length - 1 && <ArrowRight size={14} className="text-slate-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            {sectionNames.map((section) => {
              const meta = sectionStatuses[section]
              const isActive = section === selectedSection
              return (
                <button
                  key={section}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => setSelectedSection(section)}
                >
                  <span className="flex items-center gap-2">
                    {meta.status === '✓' ? <Check size={14} /> : meta.status === '⚠' ? <Circle size={10} fill="currentColor" /> : meta.status === '○' ? <span className="h-2.5 w-2.5 rounded-full border border-current" /> : null}
                    {section}
                  </span>
                  {meta.count ? <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">{meta.count}</span> : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Filter</span>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800"
              >
                <option>All</option>
                <option>Needs Review</option>
                <option>Approved</option>
                <option>Low Confidence</option>
              </select>
            </div>
            <button
              onClick={approveHighConfidence}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Approve High Confidence
            </button>
          </div>

          <div className="table-grid overflow-hidden">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Target Field</th>
                  <th className="px-4 py-3 font-medium">Proposed Value</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleMappings.map((mapping) => (
                  <tr
                    key={mapping.id}
                    className={`border-t border-slate-200 hover:bg-slate-50 ${selectedMapping?.id === mapping.id ? 'bg-slate-50' : ''}`}
                    onClick={() => setSelectedMapping(mapping)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{mapping.targetField}</td>
                    <td className="px-4 py-3 text-slate-700">{String(mapping.proposedValue)}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${getConfidenceStyle(mapping.confidence)}`}>
                        {mapping.confidence}% {getConfidenceLabel(mapping.confidence)}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={mapping.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{mapping.source.documentName}</td>
                    <td className="px-4 py-3 text-slate-600">View</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedMapping && (
          <aside className="review-panel shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{selectedMapping.targetField}</h2>
              <button onClick={() => setSelectedMapping(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Proposed Value</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{String(selectedMapping.proposedValue)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Confidence</div>
                  <div className="mt-2 text-sm font-medium text-slate-800">{selectedMapping.confidence}%</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Review</div>
                  <div className="mt-2 text-sm font-medium text-slate-800">{selectedMapping.confidence >= 75 ? 'Review Recommended' : 'Low confidence'}</div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Source</div>
                <div className="mt-2 text-sm text-slate-800">{selectedMapping.source.documentName}</div>
                <div className="mt-1 text-sm text-slate-600">Sheet: {selectedMapping.source.sheet}</div>
                <div className="mt-1 text-sm text-slate-600">Row: {selectedMapping.source.row}</div>
                <div className="mt-1 text-sm text-slate-600">Original label: {selectedMapping.source.originalLabel}</div>
                <div className="mt-1 text-sm text-slate-600">Original value: {String(selectedMapping.source.originalValue)}</div>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Mapping Rationale</div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{selectedMapping.rationale}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={acceptMapping} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                  Accept Mapping
                </button>
                <button onClick={() => setIsEditing(true)} className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  Correct
                </button>
                <button onClick={rejectMapping} className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  Reject
                </button>
              </div>

              {isEditing && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Correct Value</label>
                    <input
                      value={correctValue}
                      onChange={(e) => setCorrectValue(e.target.value)}
                      placeholder={String(selectedMapping.proposedValue)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Target Field</label>
                    <select
                      value={targetField}
                      onChange={(e) => setTargetField(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    >
                      <option>Contingent Revenue</option>
                      <option>Total Revenue</option>
                      <option>Commission Revenue</option>
                      <option>Other Revenue</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Reviewer Note</label>
                    <textarea
                      value={reviewerNote}
                      onChange={(e) => setReviewerNote(e.target.value)}
                      placeholder="Optional note"
                      className="h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                    />
                  </div>

                  <button onClick={saveCorrection} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                    Save Correction
                  </button>
                </div>
              )}

              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 opacity-60" title="Source document viewer coming in a later version.">
                <FolderPlus size={15} />
                View Source
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function ExportPage() {
  const navigate = useNavigate()

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Data Book Ready</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ['94%', 'Fields Populated'],
            ['87%', 'Automatically Approved'],
            ['13', 'Fields Manually Reviewed'],
            ['3', 'Unresolved Fields'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-2xl font-semibold text-slate-900">{value}</div>
              <div className="mt-1 text-sm text-slate-600">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Revenue totals reconcile</div>
            <div className="flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Client totals reconcile</div>
            <div className="flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Carrier classifications reviewed</div>
            <div className="flex items-center gap-2"><Circle size={10} fill="currentColor" className="text-amber-500" /> 1 unresolved mapping remains</div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
            <Download size={15} />
            Download Review Log
          </button>
          <button onClick={() => navigate('/deals/abc-brokerage-acquisition/review')} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
            <Download size={15} />
            Download Completed Data Book
          </button>
        </div>
      </div>
    </div>
  )
}

function DealsPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        <DealTable />
      </div>
    </div>
  )
}

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/deals" replace />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/deals/new" element={<NewDealPage />} />
        <Route path="/deals/:dealId/process" element={<ProcessingPage />} />
        <Route path="/deals/:dealId/review" element={<ReviewPage />} />
        <Route path="/deals/:dealId/export" element={<ExportPage />} />
      </Routes>
    </AppLayout>
  )
}

export default App
