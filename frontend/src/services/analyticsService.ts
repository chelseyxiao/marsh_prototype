import type { WholesalerAnalysis } from '../types'

const API_BASE = 'http://localhost:8000'

export async function analyzeWholesalers(file: File): Promise<WholesalerAnalysis> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/api/analytics/wholesalers`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let detail = 'Unable to analyze file.'
    try {
      const payload = await response.json()
      if (payload && typeof payload.detail === 'string') {
        detail = payload.detail
      }
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(detail)
  }

  const result = await response.json()
  return {
    policiesAnalyzed: result.policies_analyzed,
    wholesalersIdentified: result.wholesalers_identified,
    totalPremium: Number(result.total_premium),
    topWholesalers: (result.top_wholesalers ?? []).map((item: any) => ({
      wholesaler: item.wholesaler,
      totalPremium: Number(item.total_premium),
      policyCount: Number(item.policy_count),
    })),
  }
}
