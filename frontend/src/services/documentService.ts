import type { DealDocument } from '../types'

export function formatBytes(bytes?: number): string {
  if (!bytes) {
    return '—'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function createMockDocuments(files: File[]): DealDocument[] {
  return files.map((file, index) => ({
    id: `uploaded-${Date.now()}-${index}`,
    dealId: 'new-deal',
    filename: file.name,
    fileType: file.name.split('.').pop()?.toUpperCase() ?? 'FILE',
    fileSize: file.size,
    status: 'Uploaded',
  }))
}
