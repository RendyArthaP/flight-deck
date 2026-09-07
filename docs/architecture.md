# FlightDeck architecture

## Product boundary

FlightDeck implements the discovery flow end to end: homepage → validated search → progressive results → filter/sort → details → selected itinerary review. All flight data is simulated through real Nuxt HTTP endpoints. There is no payment, reservation, authentication, account system or database, and the UI states that clearly.

## Responsibility map

```text
app/
  assets/css/           Tokens and responsive product styling
  components/           Small UI primitives and original vector artwork
  layouts/              Navigation and selected-trip entrypoint
  pages/                Home, flight results, itinerary review
  plugins/              Request-scoped TanStack Query client
features/
  airport-search/       HTTP lookup and supported display catalog
  flight-search/        Form, search/detail clients, query orchestration,
                        validation, URL parsing, filtering/ranking/deduplication
  flight-filters/       Controlled filter controls
shared/
  contracts/            Runtime DTO schemas, DTO/domain types and explicit mapper
  utils/                Date, local-time, duration and currency formatting
stores/                 Client-owned selected itinerary identity
server/
  api/                  HTTP validation and endpoint responses
  data/                 Airport metadata
  utils/                Deterministic generator and cancellable provider delay
scripts/                Reproducible screenshots and domain profiling
tests/                 Pure-domain, component and browser behavior tests
```

Presentation consumes camelCase domain models. Raw provider/API field names are limited to contracts, mapping and server generation. Shared runtime imports use Nuxt's official `#shared` alias, avoiding a relative-external-path issue observed in this Nuxt/Vite production build. Vitest resolves the same alias to the local shared directory.

## State ownership

| State                             | Owner                                    | Reason                                                            |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Unsubmitted form                  | Local reactive draft                     | Editing must not mutate an active search                          |
| Airport input text/open/highlight | AirportField                             | Ephemeral control state                                           |
| Airport/provider/detail responses | TanStack Query                           | Cache, retries, error/loading and cancellation belong together    |
| Selected itinerary identity       | Pinia                                    | A real cross-route user choice; no duplicated response objects    |
| Committed search/filter/sort/page | Route query                              | Refresh, sharing and browser history must reproduce the same view |
| Detail identity                   | Route query                              | Drawer can be linked/refreshed independently of filters           |
| Review identity                   | Review URL, Pinia as in-session fallback | Refresh works without localStorage or a database                  |

The search form takes the current criteria as an initial draft when opened. Only a valid submit commits it to the URL. Query keys contain normalized criteria and provider, but **exclude filter/sort/page/detail state**. Filter changes are local and cannot launch more search requests. Derived results, badges and traveller totals use computed state.

The query client is instantiated inside the Nuxt plugin per SSR app request. Queries begin after mount: the server renders a stable shell and the client starts independent providers without blocking SSR on the slowest provider. Because server query prefetching is not used, there is no unused hydration layer or duplicated cache serialization. This trades result-content SSR for simple progressive lifecycle; add SSR prefetch/dehydrate only with a measured product need.

## HTTP and runtime validation

```text
Provider engine → Nuxt normalization/HTTP → unknown JSON
→ Zod runtime validation → typed DTO → mapFlightDto → Flight → UI
```

- `GET /api/airports?q=...` returns supported airport metadata.
- `POST /api/flights/search` accepts `{ criteria, provider }`, validates with Zod and returns one provider batch.
- `GET /api/flights/:id` validates and reconstructs an itinerary identity, returning the same deterministic offer.

TypeScript cannot validate network data. Zod rejects malformed prices, empty segments and other broken response structures before they can reach cards. The mapper converts minor currency units and nested snake_case segment fields; components do not know those DTO details. Request errors and schema errors become useful retry states without raw traces.

The mock identity is a bounded base64url encoding of normalized criteria, provider and itinerary index. It is a reproducible demo identity, **not a signed booking token**. There is no restricted inventory or purchase authority attached to it. Real-provider integration should replace this with an opaque server/provider identifier and revalidate fares before handoff. API credentials belong exclusively in server runtime configuration.

## Progressive providers and cancellation

Three independent requests are the simplest transport for three providers. Alpha waits 400 ms, Bravo 900 ms and Charlie 1500 ms. They each offer up to 220 itineraries, with index ranges 0–219, 180–399 and 360–579. Overlap is intentional. Results render as each query succeeds, and successful offers remain selectable while other providers load or fail.

Charlie fails deterministically when `hash(origin + ':' + destination + ':' + departure) % 7 === 0`. One bounded retry uses the same criteria, so a deterministic outage remains visibly partial until a new search. Automated HTTP interceptions cover complete transport failure, timeout, malformed responses and recovery without exposing debug switches in production endpoints.

Each query closure captures an immutable criteria snapshot. A key change starts a new query set; the consumed TanStack `AbortSignal` cancels superseded HTTP fetches. The transport combines that signal with an 8-second timeout using `AbortSignal.any`. Old query data cannot enter the active aggregate. Airport/detail query functions read their criteria from their own query keys rather than mutable latest props.

The server's provider delay listens for response closure and cancels its timer, avoiding generation work for an abandoned request. Once synchronous generation starts, that short computation is not interruptible mid-loop; no claim is made otherwise. Browser tests hold search A, submit B through the form, observe all three A HTTP cancellations, then release A and assert only B remains.

Independent requests require no SSE reconnection semantics, polling sessions, server session storage or WebSockets. The future provider adapter can preserve the endpoint contracts.

## Deterministic mock realism

Departure times, airline, seats, cabin, baggage and fares derive from canonical validated criteria and itinerary index. Canonicalization prevents object-property order from changing detail reconstruction. Prices are for the **whole itinerary per traveller**, in IDR, with simulated taxes included; the review total multiplies by the validated party count returned by the itinerary.

Segment travel times derive from airport great-circle distance, a cruise-speed assumption and airport overhead. Connections have explicit layovers, continuous endpoints and chronological UTC timestamps. Local airport timezones control display and day offsets. Round trips contain reversed return segments on the selected local return date; itineraries that cannot return on that date are excluded. Seat counts must accommodate the whole party.

This is a deterministic stress/demo engine, not an airline schedule or route-rights database. It deliberately supplies hundreds of possibilities even when a real market would have fewer flights. Baggage, aircraft and prices are illustrative. Children use the same simulated fare as adults; infants are outside scope.

## Deduplication and ordering

Fingerprint **all segments**, including the return: airline code, flight number, origin, destination and departure datetime. This prevents different return journeys or connections collapsing together. Retain the cheapest identical itinerary; equal fares use provider name as a stable tie-breaker. The winning domain object retains its provider identity. Cards use the fingerprint as their Vue key, so arrival of a cheaper provider offer updates the same underlying card instead of destroying its focused controls.

Best uses an explainable fixed score:

```text
price in IDR / 1,000,000 + total journey minutes / 180 + stops per direction × 2
```

Lower is better. This represents a trade-off of IDR 1 million against three hours, with a connection penalty; it is an illustrative preference rather than an objective best flight. Fixed units prevent ranking changes caused only by normalization bounds expanding as providers arrive. Ties use the full fingerprint.

Cheapest sorts by full-itinerary per-person price; Fastest uses total flight and layover time for both directions; Earliest uses outbound departure. Badges are computed from the complete successful result set and may coexist. Filters apply locally with AND between dimensions and OR within a dimension. Stops describe each direction; duration includes both directions for round trips. Departure buckets use the origin airport's local clock.

## Accessibility and responsive behavior

Airport controls use labelled combobox/listbox semantics, active descendants, keyboard movement, Enter, Escape, no-match messaging and loading announcements. Debounce is 300 ms. Native dates, radios, selects and numeric traveller fields supply platform behavior. Validation associates messages with airport/date fields and provides a submission alert.

Native dialogs provide top-layer focus containment and Escape dismissal. Closing restores the originating element; if progressive pagination removed it, the results heading is a fallback focus target. Shared dialog heading IDs are unique. Detail routes loaded directly open on mount. Mobile filters are a scrollable sheet with an explicit result-count confirmation action. The results layout changes to one column, and cards reorganize rather than shrink.

Focus rings, a skip link, semantic headings, local-time labels, restrained color, reduced-motion support and decorative-art hiding are built in. Browser coverage includes keyboard focus and mobile horizontal-overflow checks. Mobile Chromium emulation does **not** establish iOS Safari or full screen-reader conformance; those remain valuable further coverage.

## Performance: measured, not assumed

`scripts/profile.mjs` loads the pure domain modules using Vite, generates 660 provider offers, validates/maps them, then samples the complete deduplicate/filter/best-sort/badge pipeline 100 times. Raw environment, sample counts, median and p95 are in [performance.json](performance.json). The measured median is approximately 3 ms for 580 unique itineraries on the local Node 24 machine.

`scripts/capture.mjs` runs against a production server, captures the full product at desktop/mobile viewports, records first-visible-result and complete-search timings, DOM/card counts and page errors. Those figures include provider delays and automation overhead, are single unthrottled local samples, and are stored in [screenshots/measurement.json](screenshots/measurement.json). They are not Core Web Vitals, Lighthouse scores or a production SLA.

The time-of-day filter exposed a concrete bottleneck: constructing an Intl timezone formatter for each of 580 flights. In 100 local iterations its median was **25.81 ms** before reuse and **0.60 ms** after caching the finite set of fixed-locale/timezone formatters. Raw before/after samples are in [performance-before.json](performance-before.json) and [performance.json](performance.json). No user or server-response data is cached in these formatter objects.

Pagination renders at most 40 cards while the full domain dataset stays available for local filtering. Route-level code splitting, request deduplication/cache, debounced airport requests, stable itinerary keys, local vector art and system fonts keep the implementation simple. The measured domain pipeline does not justify virtualization, workers or more complicated caching at this scale. Profile on actual target devices before changing that decision.

## Verification and delivery

Vitest covers domain/schema/mapper behavior and component interactions. Playwright tests desktop and mobile production builds on isolated port 3100, including real HTTP cancellation and actual 8-second transport timeouts. The suite refuses to reuse a random development server, avoiding false passes against stale code.

`npm run build` produces a Nitro Node-server artifact. Deployment requires a Node-capable host; static generation cannot serve the search endpoints. No public deployment was performed because no target was supplied. Screenshot artifacts, scripts, setup instructions and architecture notes are included in the repository.

Future work: real provider adapters, opaque fare/session identifiers, price revalidation, provider-specific passenger pricing, real airline schedules and route rules, richer accessibility/browser coverage, and measured deployed performance. Booking/payment remains intentionally excluded.

## References

[Nuxt shared directory](https://nuxt.com/docs/4.x/directory-structure/shared) · [Tailwind Nuxt integration](https://tailwindcss.com/docs/installation/framework-guides/nuxt) · [TanStack Vue Query installation](https://tanstack.com/query/latest/docs/framework/vue/installation)
