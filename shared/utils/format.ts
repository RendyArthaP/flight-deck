const timezones: Record<string, string> = {
  CGK: 'Asia/Jakarta',
  HLP: 'Asia/Jakarta',
  SIN: 'Asia/Singapore',
  DPS: 'Asia/Makassar',
  BKK: 'Asia/Bangkok',
  DMK: 'Asia/Bangkok',
  KUL: 'Asia/Kuala_Lumpur',
  SUB: 'Asia/Jakarta',
  HKG: 'Asia/Hong_Kong',
  NRT: 'Asia/Tokyo',
  HND: 'Asia/Tokyo',
  ICN: 'Asia/Seoul',
}
export const timezone = (code: string) => timezones[code] || 'UTC'
export const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(kind: 'time' | 'date' | 'day', zone: string): Intl.DateTimeFormat {
  const key = `${kind}:${zone}`
  const existing = formatters.get(key)
  if (existing) return existing
  const options: Intl.DateTimeFormatOptions =
    kind === 'time'
      ? { hour: '2-digit', minute: '2-digit' }
      : {
          year: 'numeric',
          month: kind === 'day' ? '2-digit' : 'short',
          day: kind === 'day' ? '2-digit' : 'numeric',
        }
  const created = new Intl.DateTimeFormat(kind === 'day' ? 'en-CA' : 'en-GB', {
    ...options,
    timeZone: zone,
  })
  formatters.set(key, created)
  return created
}
export const money = (amount: number) => currencyFormatter.format(amount)
export const localTime = (date: string, airport: string) =>
  formatter('time', timezone(airport)).format(new Date(date))
export const dateLabel = (date: string) => formatter('date', 'UTC').format(new Date(date))
export const airportDate = (date: string, airport: string) =>
  formatter('date', timezone(airport)).format(new Date(date))
export const dayOffset = (
  departure: string,
  arrival: string,
  origin: string,
  destination: string,
) => {
  const localDay = (value: string, code: string) =>
    formatter('day', timezone(code)).format(new Date(value))
  return Math.round(
    (Date.parse(localDay(arrival, destination)) - Date.parse(localDay(departure, origin))) /
      86400000,
  )
}
