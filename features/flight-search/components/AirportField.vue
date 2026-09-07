<script setup lang="ts">
import { computed, ref, useId, watch, onMounted, onBeforeUnmount } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchAirports } from '../../airport-search/api/airports'

import AppIcon from '../../../app/components/ui/AppIcon.vue'
const queryClient = useQueryClient()
const props = defineProps<{ modelValue: string; label: string; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
const inputElement = ref<HTMLInputElement>()
const open = ref(false)
const term = ref('')
const active = ref(0)
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const debounced = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
watch(term, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    debounced.value = value
  }, 300)
})
onBeforeUnmount(() => clearTimeout(timer))
const selectedQuery = useQuery({
  queryKey: computed(() => ['airports', props.modelValue]),
  queryFn: ({ queryKey, signal }) => fetchAirports(String(queryKey[1]), signal),
  enabled: mounted,
})
const lookup = useQuery({
  queryKey: computed(() => ['airports', debounced.value]),
  queryFn: ({ queryKey, signal }) => fetchAirports(String(queryKey[1]), signal),
  enabled: computed(() => mounted.value && open.value),
})
const selected = computed(() => selectedQuery.data.value?.find((a) => a.code === props.modelValue))
const matches = computed(() => (term.value === debounced.value ? lookup.data.value || [] : []))
const loading = computed(() => lookup.isFetching.value || term.value !== debounced.value)
function startSearch() {
  if (open.value) return
  open.value = true
  term.value = ''
  active.value = 0
}
function retryLookup() {
  inputElement.value?.focus()
  void lookup.refetch()
}
function retrySelected() {
  inputElement.value?.focus()
  void selectedQuery.refetch()
}
function updateTerm(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  term.value = event.target.value
  active.value = 0
  open.value = true
}
function select(code: string) {
  const airport = matches.value.find((item) => item.code === code)
  if (airport) queryClient.setQueryData(['airports', code], [airport])
  emit('update:modelValue', code)
  open.value = false
  term.value = ''
}
function move(direction: number) {
  if (!open.value) {
    open.value = true
    term.value = ''
    active.value = 0
    return
  }
  if (matches.value.length)
    active.value = (active.value + direction + matches.value.length) % matches.value.length
}
function enter() {
  const item = matches.value[active.value]
  if (open.value && item) select(item.code)
}
</script>
<template>
  <div class="airport-field" @focusout="!$el.contains($event.relatedTarget) && (open = false)">
    <label :for="id">{{ label }}</label>
    <div class="airport-input-row">
      <AppIcon name="plane" :size="21" /><input
        :id="id"
        ref="inputElement"
        :value="open ? term : selected?.city || modelValue"
        role="combobox"
        :aria-expanded="open"
        :aria-controls="`${id}-options`"
        aria-autocomplete="list"
        :aria-activedescendant="open && matches.length ? `${id}-option-${active}` : undefined"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        autocomplete="off"
        placeholder="City or airport"
        @focus="startSearch"
        @input="updateTerm"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="enter"
        @keydown.esc.prevent="open = false"
      /><span class="airport-code">{{ modelValue }}</span>
    </div>
    <span v-if="selectedQuery.isError.value" class="field-error"
      >Couldn’t load airport. <button type="button" @click="retrySelected">Retry</button></span
    >
    <span class="airport-subtitle">{{ selected?.name || 'Choose an airport' }}</span>
    <p v-if="error" :id="`${id}-error`" class="field-error">{{ error }}</p>
    <span v-if="open" class="sr-only" role="status">{{
      loading
        ? 'Finding airports'
        : lookup.isError.value
          ? 'Airport lookup failed'
          : `${matches.length} airports available`
    }}</span>
    <ul
      v-if="open"
      :id="`${id}-options`"
      role="listbox"
      :aria-label="`${label} airports`"
      class="airport-options"
    >
      <li
        v-for="(airport, index) in matches"
        :id="`${id}-option-${index}`"
        :key="airport.code"
        role="option"
        :aria-selected="active === index"
        :class="{ highlighted: active === index }"
        @mousedown.prevent="select(airport.code)"
      >
        <div>
          <strong>{{ airport.city }}</strong
          ><small>{{ airport.name }}</small>
        </div>
        <span>{{ airport.code }}</span>
      </li>
      <li v-if="loading" role="presentation" class="airport-empty">Finding airports…</li>
      <li v-else-if="lookup.isError.value" role="presentation" class="airport-empty">
        Airport lookup failed.
        <button type="button" class="text-button" @click="retryLookup">Try again</button>
      </li>
      <li v-else-if="!matches.length" class="airport-empty" role="presentation">
        No airports found. Try a city or airport code.
      </li>
    </ul>
  </div>
</template>
