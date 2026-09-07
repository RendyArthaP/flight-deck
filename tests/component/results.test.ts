import { render, screen, fireEvent } from '@testing-library/vue'
import { describe, it, expect } from 'vitest'
import FlightCard from '../../features/flight-search/components/FlightCard.vue'
import FlightFilters from '../../features/flight-filters/components/FlightFilters.vue'
import { emptyFilters } from '../../features/flight-search/utils/results'
import { generateFlight } from '../../server/utils/flights'
import { mapFlightDto } from '../../shared/contracts/flights'
const flight = mapFlightDto(
  generateFlight(
    {
      origin: 'CGK',
      destination: 'SIN',
      departure: '2027-10-12',
      returnDate: '',
      tripType: 'one-way',
      adults: 1,
      children: 0,
      cabin: 'economy',
    },
    'Alpha',
    0,
  ),
)
describe('result interactions', () => {
  it('selects the actual itinerary and opens its details', async () => {
    const { emitted } = render(FlightCard, { props: { flight, badges: ['BEST'] } })
    await fireEvent.click(screen.getByRole('button', { name: 'Flight details' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Select flight' }))
    expect(emitted().details).toEqual([[flight.id]])
    expect(emitted().select).toEqual([[flight.id]])
  })
  it('emits meaningful URL filter changes', async () => {
    const { emitted } = render(FlightFilters, {
      props: { filters: emptyFilters(), airlines: [{ code: 'GA', name: 'Garuda Indonesia' }] },
    })
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Direct' }))
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Garuda Indonesia' }))
    expect(emitted().change).toEqual([
      ['stops', '0'],
      ['airlines', 'GA'],
    ])
    await fireEvent.click(screen.getByRole('button', { name: 'Reset all' }))
    expect(emitted().clear).toHaveLength(1)
  })
})
