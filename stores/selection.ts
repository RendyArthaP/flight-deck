import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useSelectionStore = defineStore('selection', () => {
  const itineraryId = ref<string | null>(null)
  function select(id: string) {
    itineraryId.value = id
  }
  return { itineraryId, select }
})
