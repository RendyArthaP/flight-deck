import {
  flightResponseSchema,
  detailResponseSchema,
  mapFlightDto,
  type Provider,
} from '#shared/contracts/flights'
import type { SearchDraft } from '../schemas/search'
async function request(url: string, signal: AbortSignal, body?: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  })
  if (!response.ok) throw new Error('We couldn’t reach this flight provider. Please try again.')
  return response.json()
}
export async function searchProvider(
  criteria: SearchDraft,
  provider: Provider,
  signal: AbortSignal,
) {
  return flightResponseSchema
    .parse(await request('/api/flights/search', signal, { criteria, provider }))
    .data.map(mapFlightDto)
}
export async function flightDetail(id: string, signal: AbortSignal) {
  return mapFlightDto(
    detailResponseSchema.parse(await request(`/api/flights/${encodeURIComponent(id)}`, signal))
      .data,
  )
}
