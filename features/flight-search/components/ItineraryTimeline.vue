<script setup lang="ts">
import type { Flight } from '#shared/contracts/flights'
import { airportDate, duration, localTime } from '#shared/utils/format'
defineProps<{ flight: Flight }>()
</script>
<template>
  <section
    v-for="direction in ['outbound', 'return'] as const"
    :key="direction"
    class="journey-timeline"
  >
    <template v-if="flight.segments.some((s) => s.direction === direction)"
      ><h3>{{ direction === 'outbound' ? 'Outbound journey' : 'Return journey' }}</h3>
      <template
        v-for="(segment, index) in flight.segments.filter((s) => s.direction === direction)"
        :key="`${segment.flightNumber}-${direction}`"
        ><div v-if="index > 0" class="layover">
          Layover in {{ segment.origin }} ·
          {{
            duration(
              (Date.parse(segment.departureAt) -
                Date.parse(
                  flight.segments.filter((s) => s.direction === direction)[index - 1]?.arrivalAt ||
                    segment.departureAt,
                )) /
                60000,
            )
          }}
        </div>
        <div class="segment">
          <div class="segment-time">
            <strong>{{ localTime(segment.departureAt, segment.origin) }}</strong
            ><span>{{ airportDate(segment.departureAt, segment.origin) }}</span>
          </div>
          <div>
            <strong>{{ segment.origin }} → {{ segment.destination }}</strong>
            <p>{{ flight.airline }} · {{ segment.flightNumber }}</p>
            <p>{{ duration(segment.durationMinutes) }} · {{ segment.aircraft }}</p>
            <p>
              Arrives {{ localTime(segment.arrivalAt, segment.destination) }} ·
              {{ airportDate(segment.arrivalAt, segment.destination) }}
            </p>
          </div>
        </div></template
      ></template
    >
  </section>
</template>
