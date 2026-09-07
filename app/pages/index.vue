<script setup lang="ts">
import FlightSearchForm from '../../features/flight-search/components/FlightSearchForm.vue'
const searchForm = ref<InstanceType<typeof FlightSearchForm>>()
const destinations = [
  {
    code: 'SIN',
    city: 'Singapore',
    country: 'Singapore',
    tag: 'THE CITY ESCAPE',
    description: 'Big-city energy. A world of flavours.',
    time: '1h 50m',
    style: 'mint',
  },
  {
    code: 'DPS',
    city: 'Bali',
    country: 'Indonesia',
    tag: 'THE SLOWER PACE',
    description: 'A little sunshine for your state of mind.',
    time: '1h 55m',
    style: 'sage',
  },
  {
    code: 'BKK',
    city: 'Bangkok',
    country: 'Thailand',
    tag: 'THE NEXT ADVENTURE',
    description: 'Golden temples. Unforgettable evenings.',
    time: '3h 30m',
    style: 'sand',
  },
]
</script>
<template>
  <div class="home-page">
    <section class="hero container" aria-labelledby="hero-heading">
      <div class="hero-copy">
        <div class="eyebrow hero-eyebrow">
          <span class="little-line" /> A BETTER WAY TO GET THERE
        </div>
        <h1 id="hero-heading">
          Find the right flight,<br /><span>faster.</span
          ><svg class="hero-swoosh" viewBox="0 0 190 16" aria-hidden="true">
            <path
              d="M3 10c61-11 120-9 182-2M42 15c42-7 87-7 127-4"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
            />
          </svg>
        </h1>
        <p>
          Compare routes, schedules and fares without the noise.<br class="desktop-break" />
          Less time searching. More looking forward.
        </p>
      </div>
      <JourneyArtwork />
    </section>
    <section class="container search-section" aria-label="Plan your flight">
      <FlightSearchForm ref="searchForm" />
      <div class="search-assurances">
        <span><UiAppIcon name="check" :size="15" /> One search. More possibilities.</span
        ><span><UiAppIcon name="check" :size="15" /> The details that matter.</span
        ><span><UiAppIcon name="check" :size="15" /> Your trip, your choice.</span>
      </div>
    </section>
    <section id="explore" class="destinations-section container" aria-labelledby="explore-heading">
      <div class="section-heading">
        <div>
          <span class="eyebrow">A CHANGE OF SCENERY</span>
          <h2 id="explore-heading">Where to next?</h2>
          <p>A few favourites from Jakarta, for a little inspiration.</p>
        </div>
        <span class="from-label"><UiAppIcon name="pin" :size="16" /> Departing from Jakarta</span>
      </div>
      <div class="destination-grid">
        <button
          v-for="destination in destinations"
          :key="destination.code"
          type="button"
          class="destination-card"
          :aria-label="`Plan a trip from Jakarta to ${destination.city}`"
          @click="searchForm?.chooseRoute(destination.code)"
        >
          <div class="destination-image" :class="destination.style">
            <DestinationArt :destination="destination.code" /><span class="destination-tag">{{
              destination.tag
            }}</span
            ><span class="destination-open"><UiAppIcon name="arrow" :size="19" /></span>
          </div>
          <div class="destination-info">
            <div class="destination-title">
              <h3>{{ destination.city }}</h3>
              <span>{{ destination.country }}</span>
            </div>
            <p>{{ destination.description }}</p>
            <div class="destination-route">
              <span>CGK <span class="route-dash">—</span> {{ destination.code }}</span
              ><span>~{{ destination.time }} direct <UiAppIcon name="arrow" :size="15" /></span>
            </div>
          </div>
        </button>
      </div>
      <p class="route-disclaimer">Destinations for inspiration. Flight times are illustrative.</p>
    </section>
    <section id="why-flightdeck" class="why-section container" aria-labelledby="why-heading">
      <div class="why-intro">
        <span class="eyebrow">LESS FRICTION. MORE FREEDOM.</span>
        <h2 id="why-heading">Good journeys start<br />with clear choices.</h2>
      </div>
      <div class="why-feature">
        <span class="feature-icon"><UiAppIcon name="sliders" :size="22" /></span>
        <h3>Find your kind of flight</h3>
        <p>Early starts or extra legroom. Make space for the things that matter to you.</p>
      </div>
      <div class="why-feature">
        <span class="feature-icon"><UiAppIcon name="shield" :size="22" /></span>
        <h3>See the whole picture</h3>
        <p>Schedules, stops and baggage. The useful details, right where you need them.</p>
      </div>
      <div class="why-feature">
        <span class="feature-icon"><UiAppIcon name="spark" :size="22" /></span>
        <h3>Keep it simple</h3>
        <p>A calmer way to compare. Because getting there should be the easy part.</p>
      </div>
    </section>
    <div class="closing-note container">
      <UiAppIcon name="plane" :size="19" /><span>Somewhere new is closer than you think.</span
      ><a href="#flight-search">Let’s get you there <UiAppIcon name="arrow" :size="16" /></a>
    </div>
  </div>
</template>
