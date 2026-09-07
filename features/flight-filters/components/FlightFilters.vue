<script setup lang="ts">
import type { Filters } from '../../flight-search/utils/results'
import { money, duration } from '#shared/utils/format'
const props = defineProps<{ filters: Filters; airlines: { code: string; name: string }[] }>()
const emit = defineEmits<{ change: [key: string, value: string | undefined]; clear: [] }>()
function toggle(key: 'stops' | 'airlines' | 'times', value: string) {
  const next = props.filters[key].includes(value)
    ? props.filters[key].filter((v) => v !== value)
    : [...props.filters[key], value]
  emit('change', key, next.join(',') || undefined)
}
function input(key: string, event: Event) {
  if (event.target instanceof HTMLInputElement) emit('change', key, event.target.value)
}
</script>
<template>
  <div class="filters-content">
    <div class="filters-heading">
      <h2>Filters</h2>
      <button type="button" class="text-button" @click="$emit('clear')">Reset all</button>
    </div>
    <fieldset>
      <legend>Stops per journey</legend>
      <label v-for="(label, i) in ['Direct', '1 stop', '2+ stops']" :key="label"
        ><input
          type="checkbox"
          :checked="filters.stops.includes(String(i))"
          @change="toggle('stops', String(i))"
        />{{ label }}</label
      >
    </fieldset>
    <fieldset>
      <legend>Airlines</legend>
      <label v-for="airline in airlines" :key="airline.code"
        ><input
          type="checkbox"
          :checked="filters.airlines.includes(airline.code)"
          @change="toggle('airlines', airline.code)"
        />{{ airline.name }}</label
      >
      <p v-if="!airlines.length">Airlines appear as results arrive.</p>
    </fieldset>
    <fieldset>
      <legend>Departure time</legend>
      <label v-for="time in ['morning', 'afternoon', 'evening', 'night']" :key="time"
        ><input
          type="checkbox"
          :checked="filters.times.includes(time)"
          @change="toggle('times', time)"
        /><span class="capitalize">{{ time }}</span
        ><small>{{
          { morning: '06–12', afternoon: '12–18', evening: '18–24', night: '00–06' }[
            time as 'morning'
          ]
        }}</small></label
      >
    </fieldset>
    <fieldset>
      <legend>Price per traveller</legend>
      <label class="range-field"
        >Minimum fare
        <input
          type="number"
          min="0"
          max="50000000"
          step="100000"
          :value="filters.minPrice"
          @change="input('minPrice', $event)" /></label
      ><label class="range-field"
        >Maximum: {{ money(filters.maxPrice)
        }}<input
          type="range"
          min="0"
          max="50000000"
          step="100000"
          :value="filters.maxPrice"
          @change="input('maxPrice', $event)"
      /></label>
    </fieldset>
    <fieldset>
      <legend>Total flying + layover time</legend>
      <label class="range-field"
        >Up to {{ duration(filters.maxDuration)
        }}<input
          type="range"
          min="60"
          max="4000"
          step="10"
          :value="filters.maxDuration"
          @change="input('duration', $event)"
      /></label>
    </fieldset>
  </div>
</template>
