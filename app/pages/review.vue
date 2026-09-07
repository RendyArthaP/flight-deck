<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { flightDetail } from '../../features/flight-search/api/flights'
import ItineraryTimeline from '../../features/flight-search/components/ItineraryTimeline.vue'
import { money } from '#shared/utils/format'
import { parseSearch } from '../../features/flight-search/utils/url'
import { useSelectionStore } from '../../stores/selection'
const route = useRoute(),
  selection = useSelectionStore()
const id = computed(() =>
  typeof route.query.id === 'string' ? route.query.id : selection.itineraryId || '',
)
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
const query = useQuery({
  queryKey: computed(() => ['flight', id.value]),
  queryFn: ({ queryKey, signal }) => flightDetail(String(queryKey[1]), signal),
  enabled: computed(() => ready.value && !!id.value),
})
const parsed = computed(() => parseSearch(route.query))
const count = computed(() => query.data.value?.travellerCount || 1)
const back = computed(() => ({
  path: '/flights',
  query: { ...route.query, id: undefined, detail: undefined },
}))
useHead({ title: 'Your itinerary — FlightDeck' })
</script>
<template>
  <div class="review-page container">
    <NuxtLink :to="parsed.success ? back : '/'" class="text-button"
      >← {{ parsed.success ? 'Back to flights' : 'Find a flight' }}</NuxtLink
    >
    <div v-if="!id" class="empty-state">
      <h1>Your next journey is waiting.</h1>
      <p>Select a flight to review your itinerary.</p>
      <NuxtLink class="button-primary" to="/">Explore flights</NuxtLink>
    </div>
    <div v-else-if="query.isPending.value" class="flight-skeleton" role="status">
      Loading your itinerary…
    </div>
    <div v-else-if="query.isError.value" class="empty-state" role="alert">
      <h2>This itinerary is unavailable.</h2>
      <p>Try again or choose another flight.</p>
      <button class="button-primary" @click="query.refetch()">Try again</button>
    </div>
    <template v-else-if="query.data.value"
      ><div class="review-heading">
        <span class="eyebrow">A LITTLE LESS SEARCHING. A LITTLE MORE GOING.</span>
        <h1>Your itinerary<span>.</span></h1>
        <p>
          {{ query.data.value.origin }} → {{ query.data.value.destination }} ·
          {{ query.data.value.airline }}
        </p>
      </div>
      <div class="review-layout">
        <div class="itinerary-panel"><ItineraryTimeline :flight="query.data.value" /></div>
        <aside class="fare-panel">
          <h2>Your trip, at a glance</h2>
          <dl class="preview-details">
            <div>
              <dt>Travellers</dt>
              <dd>{{ count }}</dd>
            </div>
            <div>
              <dt>Cabin</dt>
              <dd class="capitalize">{{ query.data.value.cabin }}</dd>
            </div>
            <div>
              <dt>Checked baggage / person</dt>
              <dd>{{ query.data.value.baggageKg }} kg</dd>
            </div>
            <div>
              <dt>Cabin baggage / person</dt>
              <dd>7 kg</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{{ query.data.value.provider }}</dd>
            </div>
            <div>
              <dt>Fare per traveller</dt>
              <dd>{{ money(query.data.value.price) }}</dd>
            </div>
          </dl>
          <div class="fare-total">
            <span>Total, taxes included</span
            ><strong>{{ money(query.data.value.price * count) }}</strong>
          </div>
          <p class="demo-notice">Booking is intentionally not implemented in this demo.</p>
          <p class="preview-notice">
            Your journey is ready to review. These are simulated fares; no reservation or payment
            has been made.
          </p>
          <NuxtLink :to="back" class="button-primary">Compare more flights</NuxtLink>
        </aside>
      </div></template
    >
  </div>
</template>
