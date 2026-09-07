import { z } from 'zod'
import { airports } from '../../airport-search/data/airports'
const airport = z
  .string()
  .refine((code) => airports.some((item) => item.code === code), 'Choose an airport.')
export const searchSchema = z
  .object({
    origin: airport,
    destination: airport,
    tripType: z.enum(['round-trip', 'one-way']),
    departure: z.iso.date('Choose a valid departure date.'),
    returnDate: z.union([z.iso.date('Choose a valid return date.'), z.literal('')]),
    adults: z.number().int().min(1, 'At least one adult is required.').max(9),
    children: z.number().int().min(0).max(8),
    cabin: z.enum(['economy', 'premium-economy', 'business', 'first']),
  })
  .superRefine((value, ctx) => {
    if (value.origin === value.destination)
      ctx.addIssue({
        code: 'custom',
        path: ['destination'],
        message: 'Choose a destination different from your departure airport.',
      })
    if (
      value.tripType === 'round-trip' &&
      (!value.returnDate || value.returnDate < value.departure)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['returnDate'],
        message: 'Return date must be on or after departure.',
      })
    if (value.adults + value.children > 9)
      ctx.addIssue({
        code: 'custom',
        path: ['adults'],
        message: 'Choose up to 9 travellers per search.',
      })
  })
export type SearchDraft = z.infer<typeof searchSchema>
export function dateAfter(days: number, base = new Date()): string {
  const date = new Date(base)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
