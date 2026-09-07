<script setup lang="ts">
import { ref, watch, onBeforeUnmount, onMounted, useId } from 'vue'
const props = defineProps<{ open: boolean; title: string; returnFocusSelector?: string }>()
const emit = defineEmits<{ close: [] }>()
const titleId = useId()
const dialog = ref<HTMLDialogElement>()
let previousFocus: HTMLElement | null = null
watch(
  () => props.open,
  (open) => {
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.value?.showModal()
      document.body.style.overflow = 'hidden'
    } else {
      dialog.value?.close()
      document.body.style.overflow = ''
      if (previousFocus?.isConnected) previousFocus.focus()
      else if (props.returnFocusSelector)
        document.querySelector<HTMLElement>(props.returnFocusSelector)?.focus()
    }
  },
  { flush: 'post' },
)
onMounted(() => {
  if (props.open) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.value?.showModal()
    document.body.style.overflow = 'hidden'
  }
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>
<template>
  <dialog
    ref="dialog"
    class="app-dialog"
    :aria-labelledby="titleId"
    @cancel.prevent="emit('close')"
    @click="$event.target === dialog && emit('close')"
  >
    <div class="dialog-heading">
      <h2 :id="titleId">{{ title }}</h2>
      <button type="button" class="icon-button" aria-label="Close dialog" @click="emit('close')">
        <UiAppIcon name="close" />
      </button>
    </div>
    <slot />
  </dialog>
</template>
