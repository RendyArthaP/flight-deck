import { providerRequestSchema } from '../../../shared/contracts/flights'
import { generateProvider, hash } from '../../utils/flights'
import { providerDelay } from '../../utils/delay'
export default defineEventHandler(async (event) => {
  const input = providerRequestSchema.safeParse(await readBody(event))
  if (!input.success)
    throw createError({ statusCode: 400, statusMessage: 'Please check your search criteria.' })
  const { criteria, provider } = input.data
  const aborted = await providerDelay(event, { Alpha: 400, Bravo: 900, Charlie: 1500 }[provider])
  if (aborted) return { data: [] }
  if (
    provider === 'Charlie' &&
    hash(`${criteria.origin}:${criteria.destination}:${criteria.departure}`) % 7 === 0
  )
    throw createError({ statusCode: 503, statusMessage: 'Provider temporarily unavailable.' })
  return { data: generateProvider(criteria, provider) }
})
