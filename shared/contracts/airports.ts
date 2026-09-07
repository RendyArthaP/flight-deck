import { z } from 'zod'
export const airportSchema = z.object({
  code: z.string().regex(/^[A-Z]{3}$/),
  city: z.string(),
  country: z.string(),
  name: z.string(),
  timezone: z.string(),
  latitude: z.number(),
  longitude: z.number(),
})
export const airportResponseSchema = z.object({ data: z.array(airportSchema) })
export type Airport = z.infer<typeof airportSchema>
