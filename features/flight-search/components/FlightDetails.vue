<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { flightDetail } from '../api/flights'
import AppDialog from '../../../app/components/ui/AppDialog.vue'
import ItineraryTimeline from './ItineraryTimeline.vue'
import { money } from '#shared/utils/format'
const props = defineProps<{ id: string }>()
defineEmits<{ close: []; select: [id: string] }>()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const query = useQuery({
  queryKey: computed(() => ['flight', props.id]),
  queryFn: ({ queryKey, signal }) => flightDetail(String(queryKey[1]), signal),
  enabled: computed(() => mounted.value && !!props.id),
})
</script>
<template>
  <AppDialog
    :open="!!id"
    title="Flight details"
    class="detail-drawer"
    return-focus-selector=".results-heading h2"
    @close="$emit('close')"
    ><div v-if="query.isPending.value" class="flight-skeleton" role="status">
      Loading itinerary…
    </div>
    <div v-else-if="query.isError.value" class="empty-state" role="alert">
      <h3>We couldn’t load this itinerary.</h3>
      <p>The provider may be unavailable, timed out, or sent an incomplete response.</p>
      <button class="button-primary" @click="query.refetch()">Try again</button>
    </div>
    <template v-else-if="query.data.value"
      ><p class="eyebrow">{{ query.data.value.airline }} · {{ query.data.value.cabin }}</p>
      <ItineraryTimeline :flight="query.data.value" />
      <dl class="preview-details">
        <div>
          <dt>Checked baggage</dt>
          <dd>{{ query.data.value.baggageKg }} kg</dd>
        </div>
        <div>
          <dt>Cabin baggage</dt>
          <dd>7 kg</dd>
        </div>
        <div>
          <dt>Provider offer</dt>
          <dd>{{ query.data.value.provider }}</dd>
        </div>
        <div>
          <dt>Per traveller, taxes included</dt>
          <dd>{{ money(query.data.value.price) }}</dd>
        </div>
      </dl>
      <p class="preview-notice">
        All times are local to each airport. Fares and availability are simulated.
      </p>
      <button class="button-primary" @click="$emit('select', id)">
        Select this itinerary
      </button></template
    ></AppDialog
  >
</template>
