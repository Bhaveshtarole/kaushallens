export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const r = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } })
  if (!r.ok) throw new Error('Request failed')
  return r.json()
}

export const endpoints = {
  summary: () => api('/api/dashboard/summary'),
  centres: () => api('/api/centres'),
  centre: (id: string) => api(`/api/centres/${id}`),
  cases: () => api('/api/cases'),
  case: (id: string) => api(`/api/cases/${id}`),
  attendance: () => api('/api/attendance'),
  infrastructure: () => api('/api/infrastructure'),
  cameras: () => api('/api/camera-health'),

  // ── v1 Reconciliation & Local AI Endpoints ──
  reconciliations: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return api(`/api/v1/reconciliations${qs}`)
  },
  reconciliation: (id: string) => api(`/api/v1/reconciliations/${id}`),
  reviewReconciliation: (id: string, body: { decision: string; note: string; reviewer?: string }) =>
    api(`/api/v1/reconciliations/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),
  biometricDevices: () => api('/api/v1/biometric-devices'),
  biometricAttendance: (centreId: string, batchId: string) => api(`/api/v1/attendance/${centreId}/${batchId}`),

  // AI Health Check
  aiHealth: () => api('/api/v1/ai/health'),

  // Submit Biometric Events
  postBiometricEvents: (events: unknown[]) =>
    api('/api/v1/biometric/events', { method: 'POST', body: JSON.stringify({ events }) }),

  // Submit Video for Analysis (multipart form data or json)
  submitVideoJob: async (formData: FormData | Record<string, any>) => {
    if (formData instanceof FormData) {
      const res = await fetch('/api/v1/analysis/video-jobs', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`Video job submission failed: ${res.statusText}`)
      return res.json()
    }
    return api('/api/v1/analysis/video-jobs', { method: 'POST', body: JSON.stringify(formData) })
  },
  videoJob: (id: string) => api(`/api/v1/analysis/video-jobs/${id}`),
}
