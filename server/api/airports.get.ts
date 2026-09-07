import { airports } from '../data/airports'
export default defineEventHandler(async (event) => {
  const q = String(getQuery(event).q || '')
    .toLowerCase()
    .slice(0, 80)
  await new Promise((resolve) => setTimeout(resolve, 120))
  return { data: airports.filter((a) => `${a.code} ${a.city} ${a.name}`.toLowerCase().includes(q)) }
})
