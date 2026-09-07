import { z } from 'zod'
import { searchSchema } from '../../features/flight-search/schemas/search'
export const providers = ['Alpha', 'Bravo', 'Charlie'] as const
export const providerSchema = z.enum(providers)
export const providerRequestSchema = z.object({ criteria: searchSchema, provider: providerSchema })
const segmentSchema = z.object({
  airline_code: z.string(),
  flight_number: z.string(),
  origin: z.string(),
  destination: z.string(),
  departure_at: z.iso.datetime(),
  arrival_at: z.iso.datetime(),
  duration_minutes: z.number().positive(),
  aircraft: z.string(),
  direction: z.enum(['outbound', 'return']),
})
export const flightDtoSchema = z.object({
  id: z.string(),
  provider: providerSchema,
  airline: z.string(),
  airline_code: z.string(),
  flight_number: z.string(),
  origin: z.string(),
  destination: z.string(),
  departure_at: z.iso.datetime(),
  arrival_at: z.iso.datetime(),
  duration_minutes: z.number().positive(),
  stops: z.number().int().min(0),
  stop_airports: z.array(z.string()),
  price_minor: z.number().int().positive(),
  currency: z.literal('IDR'),
  traveller_count: z.number().int().min(1).max(9),
  available_seats: z.number().int().positive(),
  cabin: searchSchema.shape.cabin,
  baggage_kg: z.number().min(0),
  segments: z.array(segmentSchema).min(1),
})
export const flightResponseSchema = z.object({ data: z.array(flightDtoSchema) })
export const detailResponseSchema = z.object({ data: flightDtoSchema })
export type FlightDto = z.infer<typeof flightDtoSchema>
export type Provider = z.infer<typeof providerSchema>
export interface Segment {
  airlineCode: string
  flightNumber: string
  origin: string
  destination: string
  departureAt: string
  arrivalAt: string
  durationMinutes: number
  aircraft: string
  direction: 'outbound' | 'return'
}
export interface Flight {
  id: string
  provider: Provider
  airline: string
  airlineCode: string
  flightNumber: string
  origin: string
  destination: string
  departureAt: string
  arrivalAt: string
  durationMinutes: number
  stops: number
  stopAirports: string[]
  price: number
  currency: 'IDR'
  travellerCount: number
  availableSeats: number
  cabin: string
  baggageKg: number
  segments: Segment[]
}
export function mapFlightDto(dto: FlightDto): Flight {
  return {
    id: dto.id,
    provider: dto.provider,
    airline: dto.airline,
    airlineCode: dto.airline_code,
    flightNumber: dto.flight_number,
    origin: dto.origin,
    destination: dto.destination,
    departureAt: dto.departure_at,
    arrivalAt: dto.arrival_at,
    durationMinutes: dto.duration_minutes,
    stops: dto.stops,
    stopAirports: dto.stop_airports,
    price: dto.price_minor / 100,
    currency: dto.currency,
    travellerCount: dto.traveller_count,
    availableSeats: dto.available_seats,
    cabin: dto.cabin,
    baggageKg: dto.baggage_kg,
    segments: dto.segments.map((s) => ({
      airlineCode: s.airline_code,
      flightNumber: s.flight_number,
      origin: s.origin,
      destination: s.destination,
      departureAt: s.departure_at,
      arrivalAt: s.arrival_at,
      durationMinutes: s.duration_minutes,
      aircraft: s.aircraft,
      direction: s.direction,
    })),
  }
}
