import { describe, expect, it } from 'vitest'
import {
  dateAfter,
  searchSchema,
  type SearchDraft,
} from '../../features/flight-search/schemas/search'
const valid: SearchDraft = {
  origin: 'CGK',
  destination: 'SIN',
  departure: '2026-10-12',
  returnDate: '2026-10-16',
  tripType: 'round-trip',
  adults: 1,
  children: 0,
  cabin: 'economy',
}
describe('search draft validation', () => {
  it('accepts a round trip', () => expect(searchSchema.safeParse(valid).success).toBe(true))
  it.each([
    { destination: 'CGK' },
    { origin: '' },
    { destination: 'XYZ' },
    { departure: '' },
    { departure: '2026-02-30' },
    { returnDate: '2026-10-11' },
    { returnDate: '' },
    { adults: 0 },
    { adults: 9, children: 1 },
  ])('rejects invalid criteria %j', (patch) =>
    expect(searchSchema.safeParse({ ...valid, ...patch }).success).toBe(false),
  )
  it('accepts one way without a return date', () =>
    expect(searchSchema.safeParse({ ...valid, tripType: 'one-way', returnDate: '' }).success).toBe(
      true,
    ))
  it('handles year boundaries when choosing default dates', () =>
    expect(dateAfter(5, new Date('2026-12-29T12:00:00Z'))).toBe('2027-01-03'))
})
