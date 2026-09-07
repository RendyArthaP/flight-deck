import { fireEvent, render, screen, waitFor, type RenderOptions } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { airports } from '../../server/data/airports'
import AirportField from '../../features/flight-search/components/AirportField.vue'
import FlightSearchForm from '../../features/flight-search/components/FlightSearchForm.vue'
import AppIcon from '../../app/components/ui/AppIcon.vue'

const options = (): Pick<RenderOptions<typeof AirportField>, 'global'> => ({
  global: {
    components: { UiAppIcon: AppIcon },
    plugins: [
      [
        VueQueryPlugin,
        { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
      ],
    ],
  },
})
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const q = new URL(url, 'http://localhost').searchParams.get('q')?.toLowerCase() || ''
      return new Response(
        JSON.stringify({
          data: airports.filter((a) => `${a.city} ${a.code} ${a.name}`.toLowerCase().includes(q)),
        }),
        { status: 200 },
      )
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())
describe('airport picker', () => {
  it('selects a matching airport with the keyboard', async () => {
    const user = userEvent.setup()
    const { emitted } = render(AirportField, {
      ...options(),
      props: { modelValue: 'CGK', label: 'From' },
    })
    await user.click(screen.getByRole('combobox', { name: 'From' }))
    await user.type(screen.getByRole('combobox', { name: 'From' }), 'tokyo')
    await screen.findByRole('option', { name: /Haneda/ })
    await user.keyboard('{ArrowDown}{Enter}')
    expect(emitted()['update:modelValue']).toEqual([['HND']])
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
  it('shows no matches and supports Escape', async () => {
    const user = userEvent.setup()
    render(AirportField, { ...options(), props: { modelValue: 'CGK', label: 'From' } })
    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('combobox'), 'zzzz')
    expect(await screen.findByText(/No airports found/)).toBeVisible()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
describe('flight search form', () => {
  it('swaps the route and disables return for one way', async () => {
    const user = userEvent.setup()
    render(FlightSearchForm, options())
    await user.click(screen.getByRole('button', { name: 'Swap origin and destination' }))
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'From' })).toHaveValue('Singapore'),
    )
    expect(screen.getByRole('combobox', { name: 'To' })).toHaveValue('Jakarta')
    await user.click(screen.getByRole('radio', { name: 'One way' }))
    expect(screen.getByLabelText('Return', { exact: true })).toBeDisabled()
  })
  it('explains invalid return dates', async () => {
    render(FlightSearchForm, options())
    await fireEvent.update(screen.getByLabelText('Return', { exact: true }), '2020-01-01')
    await fireEvent.click(screen.getByRole('button', { name: 'Search flights' }))
    expect(screen.getByText('Return date must be on or after departure.')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Please check')
  })
})
