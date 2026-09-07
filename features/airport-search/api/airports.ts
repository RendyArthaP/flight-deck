import { airportResponseSchema, type Airport } from '#shared/contracts/airports'
export async function fetchAirports(q: string, signal: AbortSignal): Promise<Airport[]> {
  const response = await fetch(`/api/airports?q=${encodeURIComponent(q)}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  })
  if (!response.ok) throw new Error('Airport lookup failed. Please try again.')
  return airportResponseSchema.parse(await response.json()).data.map((a) => ({ ...a }))
}
