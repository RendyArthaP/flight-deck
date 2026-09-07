<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '../../../app/components/ui/AppIcon.vue'
const props = defineProps<{ adults: number; children: number; error?: string }>()
const emit = defineEmits<{ 'update:adults': [value: number]; 'update:children': [value: number] }>()
const travellersOpen = ref(false)
const travellerCount = computed(() => props.adults + props.children)
function update(group: 'adults' | 'children', event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  const value = event.target.valueAsNumber
  if (group === 'adults') emit('update:adults', value)
  else emit('update:children', value)
}
</script>
<template>
  <div
    class="travellers-field form-field"
    @focusout="!$el.contains($event.relatedTarget) && (travellersOpen = false)"
    @keydown.esc.prevent="travellersOpen = false"
  >
    <span id="travellers-label" class="field-label">Travellers</span
    ><button
      type="button"
      class="field-control"
      aria-labelledby="travellers-label travellers-value"
      :aria-expanded="travellersOpen"
      aria-controls="travellers-panel"
      @click="travellersOpen = !travellersOpen"
    >
      <AppIcon name="user" :size="18" /><span id="travellers-value"
        >{{ travellerCount }} {{ travellerCount === 1 ? 'traveller' : 'travellers' }}</span
      ><AppIcon name="chevron" :size="14" />
    </button>
    <div v-if="travellersOpen" id="travellers-panel" class="travellers-popover">
      <div v-for="group in ['adults', 'children'] as const" :key="group" class="traveller-row">
        <label :for="group"
          ><strong>{{ group === 'adults' ? 'Adults' : 'Children' }}</strong
          ><small>{{ group === 'adults' ? '12 years and over' : '2–11 years' }}</small></label
        ><input
          :id="group"
          :value="group === 'adults' ? adults : children"
          type="number"
          :min="group === 'adults' ? 1 : 0"
          :max="group === 'adults' ? 9 : 8"
          @input="update(group, $event)"
        />
      </div>
      <p>Up to 9 travellers per search.</p>
      <button type="button" class="text-button" @click="travellersOpen = false">
        Done <AppIcon name="check" :size="16" />
      </button>
    </div>
    <p v-if="error" class="field-error" role="alert">
      {{ error }}
    </p>
  </div>
</template>
