import type { Flight } from '#shared/contracts/flights'
import { localTime } from '#shared/utils/format'
export type Sort = 'best' | 'cheapest' | 'fastest' | 'earliest'
export interface Filters {
  stops: string[]
  airlines: string[]
  times: string[]
  minPrice: number
  maxPrice: number
  maxDuration: number
}
export const emptyFilters = (): Filters => ({
  stops: [],
  airlines: [],
  times: [],
  minPrice: 0,
  maxPrice: 50000000,
  maxDuration: 4000,
})
export const fingerprint = (f: Flight) =>
  f.segments
    .map((s) => [s.airlineCode, s.flightNumber, s.origin, s.destination, s.departureAt].join('|'))
    .join('~')
export function deduplicate(flights: Flight[]) {
  const map = new Map<string, Flight>()
  for (const f of flights) {
    const key = fingerprint(f),
      existing = map.get(key)
    if (
      !existing ||
      f.price < existing.price ||
      (f.price === existing.price && f.provider < existing.provider)
    )
      map.set(key, f)
  }
  return [...map.values()]
}
export const bestScore = (f: Flight) => f.price / 1000000 + f.durationMinutes / 180 + f.stops * 2
export function sortFlights(flights: Flight[], sort: Sort): Flight[] {
  return [...flights].sort((a, b) => {
    const diff =
      sort === 'cheapest'
        ? a.price - b.price
        : sort === 'fastest'
          ? a.durationMinutes - b.durationMinutes
          : sort === 'earliest'
            ? Date.parse(a.departureAt) - Date.parse(b.departureAt)
            : bestScore(a) - bestScore(b)
    return diff || fingerprint(a).localeCompare(fingerprint(b))
  })
}
export function timeBucket(f: Flight) {
  const hour = Number(localTime(f.departureAt, f.origin).slice(0, 2))
  return hour >= 6 && hour < 12
    ? 'morning'
    : hour >= 12 && hour < 18
      ? 'afternoon'
      : hour >= 18 && hour < 24
        ? 'evening'
        : 'night'
}
export function filterFlights(flights: Flight[], filters: Filters) {
  return flights.filter(
    (f) =>
      (!filters.stops.length || filters.stops.includes(String(Math.min(f.stops, 2)))) &&
      (!filters.airlines.length || filters.airlines.includes(f.airlineCode)) &&
      (!filters.times.length || filters.times.includes(timeBucket(f))) &&
      f.price >= filters.minPrice &&
      f.price <= filters.maxPrice &&
      f.durationMinutes <= filters.maxDuration,
  )
}
export function badges(flights: Flight[]) {
  return {
    best: sortFlights(flights, 'best')[0]?.id,
    cheapest: sortFlights(flights, 'cheapest')[0]?.id,
    fastest: sortFlights(flights, 'fastest')[0]?.id,
  }
}
