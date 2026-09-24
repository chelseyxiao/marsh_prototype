import { mockDeals, mockDocumentsByDeal, mockMappingsByDeal } from '../data/mockData'
import type { Deal, DealDocument, MappingResult } from '../types'

export async function getDeals(): Promise<Deal[]> {
  return Promise.resolve(mockDeals.map((deal) => ({ ...deal })))
}

export async function getDeal(id: string): Promise<Deal> {
  const deal = mockDeals.find((item) => item.id === id)

  if (!deal) {
    throw new Error(`Deal not found: ${id}`)
  }

  return Promise.resolve({ ...deal })
}

export async function getDealDocuments(id: string): Promise<DealDocument[]> {
  return Promise.resolve((mockDocumentsByDeal[id] ?? []).map((doc) => ({ ...doc })))
}

export async function getDealMappings(id: string): Promise<MappingResult[]> {
  return Promise.resolve((mockMappingsByDeal[id] ?? []).map((item) => ({
    ...item,
    source: { ...item.source },
  })))
}
