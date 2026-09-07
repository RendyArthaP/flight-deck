import { describe, it, expect } from 'vitest'
import { generateFlight, generateProvider, flightId, decodeId } from '../../server/utils/flights'
import { flightDtoSchema, mapFlightDto } from '../../shared/contracts/flights'
import { duration, money, localTime } from '../../shared/utils/format'
import {
  filterFlights,
  sortFlights,
  bestScore,
  deduplicate,
  fingerprint,
  emptyFilters,
  timeBucket,
  badges,
} from '../../features/flight-search/utils/results'
import {
  serializeSearch,
  parseSearch,
  parseFilters,
  parseSort,
} from '../../features/flight-search/utils/url'
import type { SearchDraft } from '../../features/flight-search/schemas/search'
const criteria: SearchDraft = {
  origin: 'CGK',
  destination: 'SIN',
  departure: '2027-10-12',
  returnDate: '2027-10-16',
  tripType: 'round-trip',
  adults: 1,
  children: 0,
  cabin: 'economy',
}
const dto = generateFlight(criteria, 'Alpha', 0)
const flight = mapFlightDto(flightDtoSchema.parse(dto))
describe('provider boundary', () => {
  it('validates and maps money and nested segment field names', () => {
    expect(flight.price).toBe(dto.price_minor / 100)
    expect(flight.segments[0]?.flightNumber).toBe(dto.segments[0]?.flight_number)
    expect(flight).not.toHaveProperty('price_minor')
  })
  it('rejects malformed payloads at runtime', () => {
    expect(flightDtoSchema.safeParse({ ...dto, price_minor: 'cheap' }).success).toBe(false)
    expect(flightDtoSchema.safeParse({ ...dto, segments: [] }).success).toBe(false)
  })
  it('generates deterministic data and reversible identities', () => {
    expect(generateFlight(criteria, 'Alpha', 0)).toEqual(dto)
    const decoded = decodeId(dto.id)
    expect(generateFlight(decoded.criteria, decoded.provider, decoded.index)).toEqual(dto)
    expect(decodeId(flightId(criteria, 'Alpha', 0))).toEqual({
      criteria,
      provider: 'Alpha',
      index: 0,
    })
    expect(() => decodeId('invalid')).toThrow()
  })
  it('supports 580 unique itineraries and cheaper overlapping provider offers', () => {
    const all = ['Alpha', 'Bravo', 'Charlie'].flatMap((p) =>
      generateProvider(criteria, p as 'Alpha').map(mapFlightDto),
    )
    expect(all).toHaveLength(660)
    expect(deduplicate(all)).toHaveLength(580)
  })
  it('generates connected segments, realistic elapsed times and ordered return trips', () => {
    for (const f of generateProvider(criteria, 'Alpha')) {
      for (const direction of ['outbound', 'return']) {
        const legs = f.segments.filter((s) => s.direction === direction)
        for (let i = 0; i < legs.length; i++) {
          const leg = legs[i]
          if (!leg) continue
          expect(Date.parse(leg.arrival_at) - Date.parse(leg.departure_at)).toBe(
            leg.duration_minutes * 60000,
          )
          if (i > 0) {
            expect(legs[i - 1]?.destination).toBe(leg.origin)
            expect(Date.parse(leg.departure_at)).toBeGreaterThan(
              Date.parse(legs[i - 1]?.arrival_at || ''),
            )
          }
        }
      }
      expect(f.segments.at(-1)?.destination).toBe('CGK')
    }
  })
  it('respects party seat counts', () => {
    expect(
      generateProvider({ ...criteria, adults: 9 }, 'Alpha').every((f) => f.available_seats >= 9),
    ).toBe(true)
  })
  it('keeps same-day return departures on the requested local date', () => {
    for (const f of generateProvider({ ...criteria, returnDate: criteria.departure }, 'Alpha')) {
      const returning = f.segments.find((s) => s.direction === 'return')
      expect(returning).toBeDefined()
      expect(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Singapore',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(returning?.departure_at || '')),
      ).toBe(criteria.departure)
    }
  })
})
describe('itinerary intelligence', () => {
  const cheap = { ...flight, id: 'cheap', price: 100000 },
    expensive = { ...flight, id: 'expensive', price: 9000000 }
  it('fingerprints all segments and preserves distinct return itineraries', () => {
    expect(fingerprint(cheap)).toBe(fingerprint(expensive))
    const distinct = {
      ...flight,
      segments: flight.segments.map((s, i) =>
        i === flight.segments.length - 1 ? { ...s, flightNumber: 'GA 9999' } : s,
      ),
    }
    expect(fingerprint(distinct)).not.toBe(fingerprint(flight))
  })
  it('retains cheapest duplicate regardless of arrival order', () => {
    expect(deduplicate([expensive, cheap])).toEqual([cheap])
    expect(deduplicate([cheap, expensive])).toEqual([cheap])
  })
  it('breaks equal offers by provider deterministically', () => {
    expect(deduplicate([{ ...flight, provider: 'Bravo' }, flight])[0]?.provider).toBe('Alpha')
  })
  it('sorts by price, total duration, time and explainable best score without mutation', () => {
    const slow = { ...cheap, id: 'slow', durationMinutes: 900, stops: 2 }
    const fast = { ...expensive, id: 'fast', durationMinutes: 100 }
    const input = [slow, fast]
    expect(sortFlights(input, 'cheapest')[0]?.id).toBe('slow')
    expect(sortFlights(input, 'fastest')[0]?.id).toBe('fast')
    expect(bestScore(slow)).toBe(0.1 + 5 + 4)
    expect(sortFlights(input, 'earliest')).toHaveLength(2)
    expect(input[0]).toBe(slow)
  })
  it('combines all filter dimensions', () => {
    const filters = {
      ...emptyFilters(),
      stops: ['0'],
      airlines: [flight.airlineCode],
      times: [timeBucket(flight)],
      minPrice: flight.price,
      maxPrice: flight.price,
      maxDuration: flight.durationMinutes,
    }
    expect(filterFlights([flight], filters)).toEqual([flight])
    expect(filterFlights([flight], { ...filters, maxPrice: flight.price - 1 })).toEqual([])
    expect(filterFlights([flight], { ...filters, stops: ['2'] })).toEqual([])
    expect(filterFlights([flight], { ...filters, airlines: ['XX'] })).toEqual([])
    expect(filterFlights([flight], { ...filters, maxDuration: 1 })).toEqual([])
  })
  it('derives multiple badges from actual results', () => {
    expect(badges([flight])).toEqual({ best: flight.id, cheapest: flight.id, fastest: flight.id })
  })
})
describe('formatting and URL state', () => {
  it('formats currency, duration, and airport local time', () => {
    expect(duration(110)).toBe('1h 50m')
    expect(money(1850000)).toBe('IDR 1,850,000')
    expect(localTime('2027-10-12T00:00:00Z', 'CGK')).toBe('07:00')
    expect(localTime('2027-10-12T00:00:00Z', 'SIN')).toBe('08:00')
  })
  it('round-trips search criteria through the URL', () => {
    expect(parseSearch(serializeSearch(criteria))).toMatchObject({ success: true, data: criteria })
    expect(parseSearch({ from: 'CGK' }).success).toBe(false)
  })
  it('parses safe filter and sort defaults', () => {
    expect(parseFilters({ maxPrice: 'NaN', stops: '0,garbage,2' })).toMatchObject({
      maxPrice: 50000000,
      stops: ['0', '2'],
    })
    expect(parseSort({ sort: 'invalid' })).toBe('best')
  })
})
