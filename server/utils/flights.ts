import { z } from 'zod'
import { airports } from '../data/airports'
import { providerSchema, type FlightDto, type Provider } from '../../shared/contracts/flights'
import { searchSchema, type SearchDraft } from '../../features/flight-search/schemas/search'
const airlines = [
  ['GA', 'Garuda Indonesia'],
  ['SQ', 'Singapore Airlines'],
  ['AK', 'AirAsia'],
  ['TR', 'Scoot'],
  ['ID', 'Batik Air'],
  ['MH', 'Malaysia Airlines'],
  ['TG', 'Thai Airways'],
  ['CX', 'Cathay Pacific'],
] as const
export function hash(value: string): number {
  let n = 2166136261
  for (const ch of value) n = Math.imul(n ^ ch.charCodeAt(0), 16777619)
  return n >>> 0
}
function airport(code: string) {
  const item = airports.find((a) => a.code === code)
  if (!item) throw new Error('Unknown airport')
  return item
}
function legMinutes(from: string, to: string) {
  const a = airport(from),
    b = airport(to),
    rad = Math.PI / 180
  const dLat = (b.latitude - a.latitude) * rad,
    dLon = (b.longitude - a.longitude) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2
  const km = 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return Math.max(45, Math.round(((km / 770) * 60 + 30) / 5) * 5)
}
function localDeparture(date: string, minutes: number, code: string) {
  const tz = airport(code).timezone
  const offset = ['Asia/Tokyo', 'Asia/Seoul'].includes(tz)
    ? 9
    : ['Asia/Jakarta', 'Asia/Bangkok'].includes(tz)
      ? 7
      : 8
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + (minutes - offset * 60) * 60000)
}
const identitySchema = z.object({
  criteria: searchSchema,
  provider: providerSchema,
  index: z.number().int().min(0).max(579),
})
export function flightId(criteria: SearchDraft, provider: Provider, index: number) {
  return Buffer.from(
    JSON.stringify({ criteria: searchSchema.parse(criteria), provider, index }),
  ).toString('base64url')
}
export function decodeId(id: string) {
  if (id.length > 1500) throw new Error('Invalid itinerary')
  return identitySchema.parse(JSON.parse(Buffer.from(id, 'base64url').toString()))
}
export function generateFlight(
  criteria: SearchDraft,
  provider: Provider,
  index: number,
): FlightDto {
  const seed = hash(JSON.stringify(searchSchema.parse(criteria))),
    n = hash(`${seed}:${index}`)
  const airline = airlines[index % airlines.length] || airlines[0]
  const stops = index % 5 < 3 ? 0 : index % 5 === 3 ? 1 : 2
  const hubs = ['KUL', 'SIN', 'BKK', 'HKG', 'DPS'].filter(
    (c) => c !== criteria.origin && c !== criteria.destination,
  )
  const connecting = Array.from(
    { length: stops },
    (_, i) => hubs[(index + i) % hubs.length] || 'KUL',
  )
  const path = [criteria.origin, ...connecting, criteria.destination]
  const segments: FlightDto['segments'] = []
  function journey(route: string[], date: string, direction: 'outbound' | 'return', start?: Date) {
    let cursor = start || localDeparture(date, 300 + (n % 1080), route[0] || criteria.origin)
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i] || criteria.origin,
        to = route[i + 1] || criteria.destination
      const duration = legMinutes(from, to) + (n % 4) * 5
      const arrival = new Date(cursor.getTime() + duration * 60000)
      segments.push({
        airline_code: airline[0],
        flight_number: `${airline[0]} ${100 + index * 3 + i + (direction === 'return' ? 2000 : 0)}`,
        origin: from,
        destination: to,
        departure_at: cursor.toISOString(),
        arrival_at: arrival.toISOString(),
        duration_minutes: duration,
        aircraft: index % 2 ? 'Airbus A320neo' : 'Boeing 737-800',
        direction,
      })
      cursor = new Date(arrival.getTime() + (65 + (n % 12) * 10) * 60000)
    }
  }
  journey(path, criteria.departure, 'outbound')
  if (criteria.tripType === 'round-trip') {
    // A same-day return cannot depart before the outbound itinerary has arrived.
    const last = segments[segments.length - 1]
    const outboundArrival = last ? new Date(last.arrival_at).getTime() : 0
    const candidate = localDeparture(criteria.returnDate, 300 + (n % 1080), criteria.destination)
    const returnStart = new Date(Math.max(candidate.getTime(), outboundArrival + 120 * 60000))
    journey([...path].reverse(), criteria.returnDate, 'return', returnStart)
  }
  const outbound = segments.filter((s) => s.direction === 'outbound'),
    first = outbound[0],
    last = outbound[outbound.length - 1]
  if (!first || !last) throw new Error('No segments')
  const outboundDuration = (Date.parse(last.arrival_at) - Date.parse(first.departure_at)) / 60000
  const total = outboundDuration * (criteria.tripType === 'round-trip' ? 2 : 1)
  const base = legMinutes(criteria.origin, criteria.destination) * 6800 + 220000 + (n % 95) * 17000
  const cabinMultiplier = { economy: 1, 'premium-economy': 1.6, business: 2.7, first: 4.1 }[
    criteria.cabin
  ]
  const providerFactor = { Alpha: 1.04, Bravo: 1, Charlie: 0.97 }[provider]
  const price =
    Math.round(
      (base *
        (stops ? 0.85 : 1) *
        cabinMultiplier *
        providerFactor *
        (criteria.tripType === 'round-trip' ? 1.87 : 1)) /
        10000,
    ) * 10000
  return {
    id: flightId(criteria, provider, index),
    provider,
    airline: airline[1],
    airline_code: airline[0],
    flight_number: first.flight_number,
    origin: criteria.origin,
    destination: criteria.destination,
    departure_at: first.departure_at,
    arrival_at: last.arrival_at,
    duration_minutes: total,
    stops,
    stop_airports: connecting,
    price_minor: price * 100,
    currency: 'IDR',
    traveller_count: criteria.adults + criteria.children,
    available_seats: 1 + (n % 9),
    cabin: criteria.cabin,
    baggage_kg: criteria.cabin === 'economy' ? (index % 3 ? 20 : 0) : 30,
    segments,
  }
}
export function generateProvider(criteria: SearchDraft, provider: Provider): FlightDto[] {
  const offset = { Alpha: 0, Bravo: 180, Charlie: 360 }[provider]
  return Array.from({ length: 220 }, (_, i) =>
    generateFlight(criteria, provider, offset + i),
  ).filter((f) => {
    const returning = f.segments.find((s) => s.direction === 'return')
    return (
      f.available_seats >= criteria.adults + criteria.children &&
      (!returning ||
        new Intl.DateTimeFormat('en-CA', {
          timeZone: airport(criteria.destination).timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(returning.departure_at)) === criteria.returnDate)
    )
  })
}
