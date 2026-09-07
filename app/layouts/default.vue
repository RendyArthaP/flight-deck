<script setup lang="ts">
import { useSelectionStore } from '../../stores/selection'
const selection = useSelectionStore()
const showTrips = ref(false)
function trips() {
  if (selection.itineraryId) {
    void navigateTo({ path: '/review', query: { id: selection.itineraryId } })
  } else {
    showTrips.value = true
  }
}
</script>
<template>
  <div class="site-shell">
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header container">
      <NuxtLink to="/" class="wordmark" aria-label="FlightDeck home"
        ><span class="brand-symbol"><UiAppIcon name="plane" :size="22" /></span>FlightDeck<span
          class="brand-dot"
          >.</span
        ></NuxtLink
      >
      <nav class="main-nav" aria-label="Main navigation">
        <NuxtLink
          to="/"
          :class="{ 'nav-active': $route.path !== '/review' }"
          :aria-current="$route.path === '/' ? 'page' : undefined"
          >Flights</NuxtLink
        ><a href="/#explore">Explore</a><button type="button" @click="trips">My trips</button>
      </nav>
      <div class="header-end">
        <span class="currency"><UiAppIcon name="globe" :size="16" /> IDR</span
        ><span class="header-divider" /><span class="small-note">Made for the journey.</span>
      </div>
    </header>
    <main id="main"><slot /></main>
    <footer class="site-footer container">
      <NuxtLink to="/" class="wordmark footer-brand"
        >FlightDeck<span class="brand-dot">.</span></NuxtLink
      >
      <p>A little less searching. A little more going.</p>
      <span>© {{ new Date().getFullYear() }} FlightDeck</span>
    </footer>
    <UiAppDialog :open="showTrips" title="Your next chapter starts here" @close="showTrips = false"
      ><p class="dialog-copy">
        You haven’t selected an itinerary yet. Start with a destination and make room for something
        new.
      </p>
      <button class="button-primary" @click="showTrips = false">
        Explore flights <UiAppIcon name="arrow" /></button
    ></UiAppDialog>
  </div>
</template>
