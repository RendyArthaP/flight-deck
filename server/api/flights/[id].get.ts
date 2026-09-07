import { decodeId, generateFlight } from '../../utils/flights'
export default defineEventHandler((event) => {
  try {
    const { criteria, provider, index } = decodeId(getRouterParam(event, 'id') || '')
    return { data: generateFlight(criteria, provider, index) }
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'This itinerary could not be found.' })
  }
})
