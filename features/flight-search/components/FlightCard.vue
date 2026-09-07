<script setup lang="ts">
import type { Flight } from '#shared/contracts/flights'
import { dayOffset, duration, localTime, money } from '#shared/utils/format'
import AppIcon from '../../../app/components/ui/AppIcon.vue'
defineProps<{ flight: Flight; badges?: string[] }>()
defineEmits<{ details: [id: string]; select: [id: string] }>()
</script>
<template>
  <article class="flight-card">
    <div class="flight-airline">
      <span class="airline-monogram">{{ flight.airlineCode }}</span>
      <div>
        <h3>{{ flight.airline }}</h3>
        <small>{{ flight.flightNumber }} · {{ flight.cabin.replace('-', ' ') }}</small>
      </div>
      <span v-for="badge in badges" :key="badge" class="flight-badge">{{ badge }}</span>
    </div>
    <div class="flight-card-main">
      <div class="flight-time">
        <strong>{{ localTime(flight.departureAt, flight.origin) }}</strong
        ><span>{{ flight.origin }}</span>
      </div>
      <div class="flight-path">
        <small>{{
          duration((Date.parse(flight.arrivalAt) - Date.parse(flight.departureAt)) / 60000)
        }}</small>
        <div class="flight-line"><span /><AppIcon name="plane" :size="16" /><span /></div>
        <span>{{
          flight.stops === 0
            ? 'Direct'
            : `${flight.stops} stop${flight.stops > 1 ? 's' : ''} · ${flight.stopAirports.join(', ')}`
        }}</span>
      </div>
      <div class="flight-time">
        <strong
          >{{ localTime(flight.arrivalAt, flight.destination)
          }}<sup
            v-if="
              dayOffset(flight.departureAt, flight.arrivalAt, flight.origin, flight.destination) > 0
            "
            class="arrival-day"
            >+{{
              dayOffset(flight.departureAt, flight.arrivalAt, flight.origin, flight.destination)
            }}</sup
          ></strong
        ><span>{{ flight.destination }}</span>
      </div>
      <div class="flight-price">
        <strong>{{ money(flight.price) }}</strong
        ><span
          >per traveller ·
          {{
            flight.segments.some((s) => s.direction === 'return') ? 'round trip' : 'one way'
          }}</span
        >
      </div>
    </div>
    <div class="flight-card-footer">
      <span
        >{{ flight.baggageKg ? `${flight.baggageKg} kg checked baggage` : 'Cabin bag only' }} ·
        {{ flight.availableSeats }} seats left</span
      >
      <div>
        <button type="button" class="text-button" @click="$emit('details', flight.id)">
          Flight details</button
        ><button type="button" class="button-primary" @click="$emit('select', flight.id)">
          Select flight <AppIcon name="arrow" :size="16" />
        </button>
      </div>
    </div>
  </article>
</template>
