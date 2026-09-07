import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import { writeFile } from 'node:fs/promises'
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  resolve: { alias: { '#shared': fileURLToPath(new URL('../shared', import.meta.url)) } },
})
try {
  const { generateProvider } = await server.ssrLoadModule('/server/utils/flights.ts')
  const { mapFlightDto, flightResponseSchema } = await server.ssrLoadModule(
    '/shared/contracts/flights.ts',
  )
  const { deduplicate, filterFlights, sortFlights, emptyFilters, badges } =
    await server.ssrLoadModule('/features/flight-search/utils/results.ts')
  const criteria = {
    origin: 'CGK',
    destination: 'SIN',
    departure: '2027-10-13',
    returnDate: '2027-10-16',
    tripType: 'round-trip',
    adults: 1,
    children: 0,
    cabin: 'economy',
  }
  const generationStart = performance.now()
  const raw = ['Alpha', 'Bravo', 'Charlie'].flatMap((p) => generateProvider(criteria, p))
  const generationMs = performance.now() - generationStart
  const validationStart = performance.now()
  const flights = flightResponseSchema.parse({ data: raw }).data.map(mapFlightDto)
  const validationMs = performance.now() - validationStart
  const samples = []
  for (let i = 0; i < 100; i++) {
    const start = performance.now()
    const unique = deduplicate(flights)
    sortFlights(filterFlights(unique, emptyFilters()), 'best')
    badges(unique)
    samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  const timeFilterSamples = []
  const unique = deduplicate(flights)
  for (let i = 0; i < 100; i++) {
    const start = performance.now()
    filterFlights(unique, {
      ...emptyFilters(),
      times: ['morning', 'afternoon', 'evening', 'night'],
    })
    timeFilterSamples.push(performance.now() - start)
  }
  timeFilterSamples.sort((a, b) => a - b)
  const result = {
    environment: `Node ${process.version}, macOS arm64, local unthrottled, 100 pipeline iterations after one generation`,
    offers: raw.length,
    uniqueItineraries: deduplicate(flights).length,
    generationMs: Number(generationMs.toFixed(2)),
    validationAndMappingMs: Number(validationMs.toFixed(2)),
    pipelineMedianMs: Number(samples[50].toFixed(2)),
    pipelineP95Ms: Number(samples[95].toFixed(2)),
    pipeline: 'deduplicate + filter + best sort + all badges',
    timeFilterMedianMs: Number(timeFilterSamples[50].toFixed(2)),
    timeFilterP95Ms: Number(timeFilterSamples[95].toFixed(2)),
  }
  await writeFile('docs/performance.json', JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
} finally {
  await server.close()
}
