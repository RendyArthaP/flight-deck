import { searchSchema, type SearchDraft } from '../schemas/search'
import { emptyFilters, type Filters, type Sort } from './results'
type Query = Record<string, unknown>
const one = (v: unknown) => (typeof v === 'string' ? v : '')
export function serializeSearch(s: SearchDraft) {
  return {
    from: s.origin,
    to: s.destination,
    departure: s.departure,
    ...(s.tripType === 'round-trip' ? { return: s.returnDate } : {}),
    adults: String(s.adults),
    children: String(s.children),
    cabin: s.cabin,
  }
}
export function parseSearch(q: Query) {
  return searchSchema.safeParse({
    origin: one(q.from),
    destination: one(q.to),
    departure: one(q.departure),
    returnDate: one(q.return),
    tripType: q.return ? 'round-trip' : 'one-way',
    adults: Number(one(q.adults) || 1),
    children: Number(one(q.children) || 0),
    cabin: one(q.cabin) || 'economy',
  })
}
const list = (v: unknown) => one(v).split(',').filter(Boolean)
const numeric = (v: unknown, fallback: number) => {
  const n = Number(one(v))
  return one(v) && Number.isFinite(n) && n >= 0 ? n : fallback
}
export function parseFilters(q: Query): Filters {
  const defaults = emptyFilters()
  return {
    stops: list(q.stops).filter((v) => ['0', '1', '2'].includes(v)),
    airlines: list(q.airlines),
    times: list(q.times).filter((v) => ['morning', 'afternoon', 'evening', 'night'].includes(v)),
    minPrice: numeric(q.minPrice, 0),
    maxPrice: numeric(q.maxPrice, defaults.maxPrice),
    maxDuration: numeric(q.duration, defaults.maxDuration),
  }
}
export function parseSort(q: Query): Sort {
  const value = one(q.sort)
  return value === 'cheapest' || value === 'fastest' || value === 'earliest' ? value : 'best'
}
export const filterKeys = ['stops', 'airlines', 'times', 'minPrice', 'maxPrice', 'duration', 'sort']
