<script setup lang="ts">
import { reactive, ref } from 'vue'
import AirportField from './AirportField.vue'
import TravellerPicker from './TravellerPicker.vue'
import AppIcon from '../../../app/components/ui/AppIcon.vue'
import { serializeSearch } from '../utils/url'
import { dateAfter, searchSchema, type SearchDraft } from '../schemas/search'

const props = defineProps<{ initial?: SearchDraft }>()
const emit = defineEmits<{ searched: [] }>()
const today = dateAfter(0)
const draft = reactive<SearchDraft>({
  origin: 'CGK',
  destination: 'SIN',
  tripType: 'round-trip',
  departure: dateAfter(35),
  returnDate: dateAfter(39),
  adults: 1,
  children: 0,
  cabin: 'economy',
  ...props.initial,
})
const errors = ref<Record<string, string>>({})
function submit() {
  const result = searchSchema.safeParse(draft)
  errors.value = {}
  if (!result.success) {
    for (const issue of result.error.issues) errors.value[String(issue.path[0])] = issue.message
    return
  }
  if (draft.departure < today) {
    errors.value.departure = 'Departure must be today or later.'
    return
  }
  emit('searched')
  void navigateTo({ path: '/flights', query: serializeSearch(result.data) })
}
function chooseRoute(destination: string) {
  draft.origin = 'CGK'
  draft.destination = destination
  document.getElementById('flight-search')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'center',
  })
}
defineExpose({ chooseRoute })
</script>
<template>
  <form id="flight-search" class="search-panel" novalidate @submit.prevent="submit">
    <div class="search-options">
      <fieldset class="trip-types">
        <legend class="sr-only">Trip type</legend>
        <label
          v-for="type in ['round-trip', 'one-way'] as const"
          :key="type"
          :class="{ selected: draft.tripType === type }"
          ><input v-model="draft.tripType" type="radio" name="trip-type" :value="type" /><span>{{
            type === 'round-trip' ? 'Round trip' : 'One way'
          }}</span></label
        >
      </fieldset>
      <span class="search-panel-note"><span class="status-dot" /> Your next story starts here</span>
    </div>
    <div class="route-fields">
      <AirportField v-model="draft.origin" label="From" :error="errors.origin" /><button
        type="button"
        class="swap-button"
        aria-label="Swap origin and destination"
        @click="[draft.origin, draft.destination] = [draft.destination, draft.origin]"
      >
        <AppIcon name="swap" :size="18" /></button
      ><AirportField v-model="draft.destination" label="To" :error="errors.destination" />
    </div>
    <div class="search-bottom">
      <div class="date-fields">
        <div class="form-field">
          <label for="departure">Departure</label>
          <div class="field-with-icon">
            <AppIcon name="calendar" :size="18" /><input
              id="departure"
              v-model="draft.departure"
              type="date"
              :min="today"
              :aria-invalid="!!errors.departure"
              :aria-describedby="errors.departure ? 'departure-error' : undefined"
            />
          </div>
          <p v-if="errors.departure" id="departure-error" class="field-error">
            {{ errors.departure }}
          </p>
        </div>
        <div class="form-field" :class="{ 'field-disabled': draft.tripType === 'one-way' }">
          <label for="return-date">Return</label>
          <div class="field-with-icon">
            <AppIcon name="calendar" :size="18" /><input
              id="return-date"
              v-model="draft.returnDate"
              type="date"
              :disabled="draft.tripType === 'one-way'"
              :min="draft.departure || today"
              :aria-invalid="!!errors.returnDate"
              :aria-describedby="errors.returnDate ? 'return-error' : undefined"
            />
          </div>
          <p v-if="errors.returnDate" id="return-error" class="field-error">
            {{ errors.returnDate }}
          </p>
        </div>
      </div>
      <TravellerPicker
        v-model:adults="draft.adults"
        v-model:children="draft.children"
        :error="errors.adults || errors.children"
      />
      <div class="form-field cabin-field">
        <label for="cabin">Cabin class</label
        ><select id="cabin" v-model="draft.cabin">
          <option value="economy">Economy</option>
          <option value="premium-economy">Premium economy</option>
          <option value="business">Business</option>
          <option value="first">First class</option>
        </select>
      </div>
      <button class="button-primary search-submit" type="submit">
        <AppIcon name="search" :size="19" /> Search flights <AppIcon name="arrow" :size="18" />
      </button>
    </div>
    <p v-if="Object.keys(errors).length" class="form-error-summary" role="alert">
      Please check the highlighted fields to continue.
    </p>
  </form>
</template>
