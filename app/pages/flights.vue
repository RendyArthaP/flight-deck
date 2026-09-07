<script setup lang="ts">
import { computed, ref } from 'vue'
import FlightSearchForm from '../../features/flight-search/components/FlightSearchForm.vue'
import FlightCard from '../../features/flight-search/components/FlightCard.vue'
import FlightDetails from '../../features/flight-search/components/FlightDetails.vue'
import FlightFilters from '../../features/flight-filters/components/FlightFilters.vue'
import { useFlightSearch } from '../../features/flight-search/composables/useFlightSearch'
import {
  badges,
  filterFlights,
  sortFlights,
  fingerprint,
} from '../../features/flight-search/utils/results'
import {
  parseSearch,
  parseFilters,
  parseSort,
  filterKeys,
} from '../../features/flight-search/utils/url'
import { dateLabel } from '#shared/utils/format'
import { useSelectionStore } from '../../stores/selection'
const route = useRoute(),
  router = useRouter(),
  selection = useSelectionStore()
const parsed = computed(() => parseSearch(route.query))
const criteria = computed(() => (parsed.value.success ? parsed.value.data : undefined))
const { flights, loading, failures, retry } = useFlightSearch(criteria)
const filters = computed(() => parseFilters(route.query)),
  sort = computed(() => parseSort(route.query))
const filtered = computed(() =>
  sortFlights(filterFlights(flights.value, filters.value), sort.value),
)
const badgeIds = computed(() => badges(flights.value))
const airlines = computed(() =>
  [
    ...new Map(
      flights.value.map((f) => [f.airlineCode, { code: f.airlineCode, name: f.airline }]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name)),
)
const modifying = ref(false),
  mobileFilters = ref(false),
  shared = ref('')
const pageSize = 40
const page = computed(() =>
  Math.max(
    1,
    Math.min(
      Math.ceil(filtered.value.length / pageSize) || 1,
      Math.floor(Number(route.query.page)) || 1,
    ),
  ),
)
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)
const detailId = computed(() => (typeof route.query.detail === 'string' ? route.query.detail : ''))
function change(key: string, value: string | undefined) {
  void router.push({
    query: { ...route.query, [key]: value, ...(key === 'page' ? {} : { page: undefined }) },
  })
}
function clear() {
  const query = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => ![...filterKeys, 'page'].includes(key)),
  )
  void router.push({ query })
}
function select(id: string) {
  selection.select(id)
  void navigateTo({ path: '/review', query: { ...route.query, detail: undefined, id } })
}
async function share() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    shared.value = 'Search link copied.'
  } catch {
    shared.value = 'Copy the address from your browser to share this search.'
  }
}
useHead({ title: 'Find your flight — FlightDeck' })
</script>
<template>
  <div class="results-page container">
    <div v-if="!criteria" class="empty-state">
      <h1>Let’s start with your route.</h1>
      <p>The search link is incomplete or invalid. Choose your airports and dates to continue.</p>
      <NuxtLink class="button-primary" to="/">Plan a flight</NuxtLink>
    </div>
    <template v-else
      ><div class="search-summary">
        <div>
          <span class="eyebrow">YOUR NEXT JOURNEY</span>
          <h1>{{ criteria.origin }} <span>→</span> {{ criteria.destination }}</h1>
          <p>
            {{ dateLabel(criteria.departure)
            }}<template v-if="criteria.tripType === 'round-trip'">
              — {{ dateLabel(criteria.returnDate) }}</template
            >
            · {{ criteria.adults + criteria.children }} traveller{{
              criteria.adults + criteria.children > 1 ? 's' : ''
            }}
            · {{ criteria.cabin.replace('-', ' ') }}
          </p>
        </div>
        <div class="summary-actions">
          <button class="text-button" @click="share">
            Share search <UiAppIcon name="arrow" :size="16" /></button
          ><button class="button-secondary" @click="modifying = !modifying">
            {{ modifying ? 'Close search' : 'Modify search' }}
          </button>
        </div>
      </div>
      <p v-if="shared" role="status" class="share-status">{{ shared }}</p>
      <FlightSearchForm
        v-if="modifying"
        :key="JSON.stringify(criteria)"
        :initial="criteria"
        @searched="modifying = false"
      />
      <div class="results-layout">
        <aside class="desktop-filters">
          <FlightFilters :filters="filters" :airlines="airlines" @change="change" @clear="clear" />
        </aside>
        <section class="results-main" aria-label="Available flights">
          <div class="results-heading">
            <div>
              <h2 tabindex="-1">
                {{ flights.length }} flights {{ loading ? 'found so far' : 'found' }}
              </h2>
              <p role="status" aria-live="polite">
                <span v-if="loading" class="status-dot" />{{
                  loading
                    ? 'Searching providers… your results are ready to explore.'
                    : 'Search complete. Find your kind of flight.'
                }}
              </p>
            </div>
            <button class="button-secondary mobile-filter-button" @click="mobileFilters = true">
              Filters
            </button>
          </div>
          <p class="demo-notice">
            Demo fares · {{ criteria.tripType === 'round-trip' ? 'Round-trip' : 'One-way' }} prices
            per traveller, taxes included.
          </p>
          <div v-if="failures && flights.length" class="provider-warning" role="status">
            {{ failures }} provider{{ failures > 1 ? 's' : '' }} couldn’t respond. You can still
            select available flights.
            <button class="text-button" @click="retry">Retry unavailable providers</button>
          </div>
          <div class="sort-tabs" aria-label="Sort flights">
            <button
              v-for="value in ['best', 'cheapest', 'fastest', 'earliest'] as const"
              :key="value"
              :aria-pressed="sort === value"
              :class="{ active: sort === value }"
              @click="change('sort', value)"
            >
              {{ value
              }}<small>{{
                value === 'best'
                  ? 'Price + time + stops'
                  : value === 'cheapest'
                    ? 'Lowest fare'
                    : value === 'fastest'
                      ? 'Shortest total trip'
                      : 'First departure'
              }}</small>
            </button>
          </div>
          <template v-if="!flights.length && loading"
            ><div v-for="n in 3" :key="n" class="flight-skeleton" aria-hidden="true">
              <div />
              <div />
              <div /></div
          ></template>
          <div v-else-if="!flights.length && failures" class="empty-state" role="alert">
            <h2>We couldn’t complete your search.</h2>
            <p>
              Providers may be unavailable, timed out, or sent incomplete data. Please try again.
            </p>
            <button class="button-primary" @click="retry">Retry search</button>
          </div>
          <div v-else-if="!filtered.length" class="empty-state">
            <h2>
              {{
                flights.length
                  ? 'No flights match your filters.'
                  : 'No flights available for this search.'
              }}
            </h2>
            <p>
              {{
                flights.length
                  ? 'Try removing some filters or expanding your price range.'
                  : 'Try another route, date, or traveller count.'
              }}
            </p>
            <button v-if="flights.length" class="button-primary" @click="clear">
              Clear filters</button
            ><button v-else class="button-primary" @click="modifying = true">Modify search</button>
          </div>
          <template v-else
            ><p class="filtered-count">
              Showing {{ (page - 1) * pageSize + 1 }}–{{
                Math.min(page * pageSize, filtered.length)
              }}
              of {{ filtered.length }} matching flights
            </p>
            <FlightCard
              v-for="flight in visible"
              :key="fingerprint(flight)"
              :flight="flight"
              :badges="
                Object.entries(badgeIds)
                  .filter(([, id]) => id === flight.id)
                  .map(([name]) => name.toUpperCase())
              "
              @details="change('detail', $event)"
              @select="select"
            />
            <nav
              v-if="filtered.length > pageSize"
              class="pagination"
              aria-label="Flight result pages"
            >
              <button
                class="button-secondary"
                :disabled="page <= 1"
                @click="change('page', String(page - 1))"
              >
                Previous</button
              ><span>Page {{ page }} of {{ Math.ceil(filtered.length / pageSize) }}</span
              ><button
                class="button-secondary"
                :disabled="page * pageSize >= filtered.length"
                @click="change('page', String(page + 1))"
              >
                Next
              </button>
            </nav></template
          >
        </section>
      </div>
      <FlightDetails
        :id="detailId"
        @close="change('detail', undefined)"
        @select="select"
      /><UiAppDialog
        :open="mobileFilters"
        title="Refine your search"
        class="filter-dialog"
        @close="mobileFilters = false"
        ><FlightFilters
          :filters="filters"
          :airlines="airlines"
          @change="change"
          @clear="clear"
        /><button class="button-primary" @click="mobileFilters = false">
          Show {{ filtered.length }} flights
        </button></UiAppDialog
      ></template
    >
  </div>
</template>
