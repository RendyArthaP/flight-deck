# FlightDeck

**Find the right flight, faster.**

A complete flight discovery and comparison portfolio built with Nuxt, Vue and TypeScript. Search, compare progressively arriving provider offers, refine your options, inspect the full journey and review a selected itinerary.

![FlightDeck search results](docs/screenshots/results-desktop.png)

[Homepage](docs/screenshots/home-desktop.png) · [Mobile results](docs/screenshots/results-mobile.png) · [Flight details](docs/screenshots/details-desktop.png) · [Itinerary review](docs/screenshots/review-desktop.png) · [Architecture](docs/architecture.md)

## The experience

- Airport autocomplete over HTTP, with 300 ms debounce, cancellation, loading/error/retry states and keyboard navigation.
- One-way and round-trip searches, airport swap, dates, adults/children and four cabin classes.
- Three deterministic mock providers with 400 / 900 / 1500 ms delays and occasional partial failure.
- Up to 660 offers / **580 unique itineraries**, including real outbound and return segment structures.
- Progressive results that stay usable while remaining providers load; cheapest-offer deduplication.
- Direct/1-stop/2+-stop, airline, departure-time, price and duration filters; Best, Cheapest, Fastest and Earliest sorting.
- Search, filter, sort, page and detail state in shareable URLs. Refresh preserves your search and selected review.
- Accessible detail drawer, segment timeline, layovers, local airport times, baggage, fare and party total.
- Responsive filters sheet and 40-result pagination to keep the DOM bounded.

**All fares, schedules, availability and provider names are simulated. Booking, payment, authentication and airline integration are intentionally outside this demo.**

All 13 implementation phases are represented in the local application, testing and documentation. A public live demo has not been deployed; no hosting destination was supplied.

## Run locally

Use Node 24 LTS (validated with **24.14.1**) and npm. Retain `package-lock.json`.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No API key, database or environment file is required.

```sh
npm run build
npm run preview
```

Production output uses Nitro's Node server: deploy `.output` and run `node .output/server/index.mjs`. `PORT` and `HOST` configure the listener. The server endpoints require a server deployment; this is not a static-only site.

## Stack and structure

| Layer           | Technology / responsibility                                            |
| --------------- | ---------------------------------------------------------------------- |
| App             | Existing Nuxt 4, Vue 3 Composition API, strict TypeScript              |
| Design          | Tailwind 4 tokens, product CSS, original local SVG artwork             |
| Server state    | TanStack Vue Query: airports, provider results and flight details      |
| Client state    | Pinia: selected itinerary identity, never copied provider responses    |
| Shareable state | Vue Router query parameters                                            |
| API boundary    | Fetch → Zod DTO validation → explicit domain mapper                    |
| Mock backend    | Nuxt server endpoints, deterministic generator and provider simulation |
| Quality         | Vitest, Vue Testing Library, Playwright, Nuxt ESLint and Prettier      |

`app/` owns pages/layout and UI primitives; `features/` owns search/filter behavior; `shared/` contains contracts and formatting; `server/` owns airport/provider data and generation. See [architecture.md](docs/architecture.md) for state ownership, lifecycle and trade-offs.

No additional dependencies were needed for Phases 3–13. Tooling retains two compatibility pins within accepted dependency ranges: Nuxt ESLint's `eslint-plugin-regexp` at 3.1.1 and `@vue/test-utils` at 2.4.6, to support the installed Node runtime. No forced installation or peer-dependency bypass is used.

## Verification

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts its own production server on **127.0.0.1:3100**. Build first and keep that port free. It never reuses an unrelated development server.

Verified locally: **34 unit/component tests and 18 desktop/mobile E2E scenarios pass**, alongside typecheck, lint, formatting and production build.

Unit/component coverage includes validation, mapper fields, money/duration/timezone formatting, deterministic generation, return segment consistency, seat capacity, full-journey fingerprinting, cheapest-offer policy, ranking, filters, URL parsing and meaningful component interactions.

Browser coverage runs on desktop and mobile Chromium: complete home-to-review journey, refresh, keyboard dialog behavior, progressive deduplication, local filtering without extra search requests, partial failure, malformed payloads with recovery, cancelled stale searches, genuine empty results, airport retry, invalid links and transport timeout.

## Reproduce screenshots and measurements

Run the production server on port 3200, then:

```sh
PORT=3200 HOST=127.0.0.1 node .output/server/index.mjs
# In another terminal:
node scripts/capture.mjs
node scripts/profile.mjs
```

Set `FLIGHTDECK_CAPTURE_URL` to capture another local preview. Scripts save [screenshots](docs/screenshots) and raw [domain performance measurements](docs/performance.json).

The time-of-day filter was optimized from **25.81 ms to 0.60 ms median** by reusing Intl formatters, with raw before/after evidence checked in. The 580-itinerary pipeline was measured at approximately **3 ms median** locally. These are unthrottled development-machine measurements, not a Lighthouse score or a production SLA. Pagination limits rendering to 40 cards; no virtualization or WebSockets were added. Full methodology and limitations are documented in [architecture.md](docs/architecture.md).

## Try the resilience behavior

A normal one-adult CGK → SIN round trip on **13–16 October 2027** produces all 580 unique itineraries. **12–16 October 2027** deterministically triggers Charlie's partial failure. Other criteria also occasionally trigger failure according to the documented seed policy.

The remaining failure cases are simulated in Playwright by intercepting HTTP responses, so no test-only fault switches are exposed in the application API.

## Next improvements

A real provider adapter with server-only credentials; fare revalidation before external handoff; provider market/schedule realism; broader browser and screen-reader testing; and field performance measurement on a deployed host. Actual booking remains a separate product scope.
