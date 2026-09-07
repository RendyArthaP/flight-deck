import { expect, test, type Page } from '@playwright/test'
const search =
  '/flights?from=CGK&to=SIN&departure=2027-10-13&return=2027-10-16&adults=1&children=0&cabin=economy'
async function directOnly(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: 'Filters', exact: true }).click()
  const scope = isMobile
    ? page.getByRole('dialog', { name: 'Refine your search' })
    : page.locator('.desktop-filters')
  await scope.getByRole('checkbox', { name: 'Direct', exact: true }).check()
  if (isMobile) await scope.getByRole('button', { name: /Show \d+ flights/ }).click()
}
test('home to filtered flight, details, selection and refreshable review', async ({
  page,
  isMobile,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  const destination = page.getByRole('combobox', { name: 'To', exact: true })
  await destination.fill('sin')
  await expect(page.getByRole('option', { name: /Singapore/ })).toBeVisible()
  await destination.press('Enter')
  await page.getByLabel('Departure', { exact: true }).fill('2027-10-13')
  await page.getByLabel('Return', { exact: true }).fill('2027-10-16')
  await page.getByRole('button', { name: 'Search flights' }).click()
  await expect(page).toHaveURL(/\/flights\?from=CGK/)
  await expect(page.locator('.flight-card').first()).toBeVisible()
  await directOnly(page, isMobile)
  await page.getByRole('button', { name: /^cheapest/i }).click()
  await expect(page).toHaveURL(/sort=cheapest/)
  await page.reload()
  await expect(page.locator('.flight-card').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /^cheapest/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('.flight-path').first()).toContainText('Direct')
  await expect(page.getByRole('heading', { name: '580 flights found', exact: true })).toBeVisible({
    timeout: 15000,
  })
  await page.getByRole('button', { name: 'Flight details', exact: true }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Flight details' })
  await expect(dialog.getByText('Return journey', { exact: true })).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Flight details', exact: true }).first(),
  ).toBeFocused()
  await page.getByRole('button', { name: 'Flight details', exact: true }).first().click()
  await dialog.getByRole('button', { name: 'Select this itinerary' }).click()
  await expect(page.getByRole('heading', { name: 'Your itinerary.' })).toBeVisible()
  await expect(
    page.getByText('Booking is intentionally not implemented in this demo.'),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByText('Return journey', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})
test('progressive results stay usable while a provider is pending, then deduplicate', async ({
  page,
}) => {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/flights/search', async (route) => {
    const { provider } = route.request().postDataJSON()
    if (provider === 'Charlie') {
      await gate
      await route.continue()
    } else await route.continue()
  })
  await page.goto(search)
  await expect(page.locator('.flight-card').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /flights found so far/ })).toBeVisible()
  release()
  await expect(page.getByRole('heading', { name: '580 flights found', exact: true })).toBeVisible({
    timeout: 15000,
  })
  await expect(page.locator('.flight-card')).toHaveCount(40)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('Page 2 of 15', { exact: true })).toBeVisible()
})
test('partial provider failure preserves successful flights', async ({ page }) => {
  await page.route('**/api/flights/search', async (route) => {
    if (route.request().postDataJSON().provider === 'Charlie')
      await route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    else await route.continue()
  })
  await page.goto(search)
  await expect(page.getByText(/1 provider couldn’t respond/)).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.flight-card').first()).toBeVisible()
  await page.getByRole('button', { name: 'Select flight', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Your itinerary.' })).toBeVisible()
})
test('malformed payloads fail safely and retry can recover', async ({ page }) => {
  await page.route('**/api/flights/search', (route) =>
    route.fulfill({ json: { data: [{ price: 'free' }] } }),
  )
  await page.goto(search)
  await expect(
    page.getByRole('heading', { name: 'We couldn’t complete your search.' }),
  ).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.flight-card')).toHaveCount(0)
  await page.unroute('**/api/flights/search')
  await page.getByRole('button', { name: 'Retry search', exact: true }).click()
  await expect(page.locator('.flight-card').first()).toBeVisible()
})
test('changing search cancels old HTTP requests and cannot show old results', async ({ page }) => {
  let oldStarted = 0,
    oldCancelled = 0
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  page.on('requestfailed', (request) => {
    if (
      request.url().endsWith('/api/flights/search') &&
      request.postDataJSON()?.criteria.destination === 'SIN'
    )
      oldCancelled++
  })
  await page.route('**/api/flights/search', async (route) => {
    if (route.request().postDataJSON().criteria.destination === 'SIN') {
      oldStarted++
      await gate
      await route.fulfill({ json: { data: [] } })
    } else await route.continue()
  })
  await page.goto(search)
  await expect.poll(() => oldStarted).toBe(3)
  await page.getByRole('button', { name: 'Modify search', exact: true }).click()
  const destination = page.getByRole('combobox', { name: 'To', exact: true })
  await destination.fill('bkk')
  await expect(page.getByRole('option', { name: /BKK/ })).toBeVisible()
  await destination.press('Enter')
  await page.getByRole('button', { name: 'Search flights', exact: true }).click()
  await expect(page).toHaveURL(/to=BKK/)
  await expect.poll(() => oldCancelled).toBe(3)
  release()
  await expect(page.locator('.flight-card').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /CGK → BKK/ })).toBeVisible()
  await expect(page.locator('.flight-time').nth(1)).toContainText('BKK')
  await expect(page.getByRole('heading', { name: /flights found$/, exact: false })).toBeVisible({
    timeout: 15000,
  })
  await expect(page.locator('.flight-time').nth(1)).toContainText('BKK')
})
test('filtering and sorting are local and URL restores filter state', async ({
  page,
  isMobile,
}) => {
  let requests = 0
  page.on('request', (r) => {
    if (r.url().endsWith('/api/flights/search')) requests++
  })
  await page.goto(search)
  await expect(page.getByRole('heading', { name: '580 flights found', exact: true })).toBeVisible({
    timeout: 15000,
  })
  const before = requests
  await directOnly(page, isMobile)
  await page.getByRole('button', { name: /^fastest/i }).click()
  await expect(page).toHaveURL(/sort=fastest/)
  expect(requests).toBe(before)
  await page.reload()
  await expect(page.locator('.flight-card').first()).toBeVisible()
  await expect(page).toHaveURL(/stops=0/)
  await expect(page.getByRole('button', { name: /^fastest/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
test('empty filters and invalid links give a useful recovery', async ({ page }) => {
  await page.goto(search + '&maxPrice=1')
  await expect(page.getByRole('heading', { name: 'No flights match your filters.' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page.locator('.flight-card').first()).toBeVisible()
  await page.goto('/flights?from=CGK')
  await expect(page.getByRole('heading', { name: 'Let’s start with your route.' })).toBeVisible()
  await page.goto('/review?id=invalid')
  await expect(page.getByRole('heading', { name: 'This itinerary is unavailable.' })).toBeVisible({
    timeout: 15000,
  })
})

test('airport failure can retry and genuine empty search can recover', async ({ page }) => {
  await page.route('**/api/airports?*', (route) =>
    route.fulfill({ status: 503, json: { message: 'Unavailable' } }),
  )
  await page.goto('/')
  await page.getByRole('combobox', { name: 'To', exact: true }).click()
  const options = page.getByRole('listbox', { name: 'To airports' })
  await expect(options.getByText('Airport lookup failed.', { exact: false })).toBeVisible({
    timeout: 10000,
  })
  await page.unroute('**/api/airports?*')
  await options.getByRole('button', { name: 'Try again' }).click()
  await expect(options.getByRole('option', { name: /Singapore/ })).toBeVisible()
  await page.route('**/api/flights/search', (route) => route.fulfill({ json: { data: [] } }))
  await page.goto(search)
  await expect(
    page.getByRole('heading', { name: 'No flights available for this search.' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Modify search', exact: true })).toHaveCount(2)
})

test('transport timeouts terminate requests and expose a retry', async ({ page }) => {
  let cancelled = 0
  page.on('requestfailed', (r) => {
    if (r.url().endsWith('/api/flights/search')) cancelled++
  })
  await page.route('**/api/flights/search', () => {})
  await page.goto(search)
  await expect(
    page.getByRole('heading', { name: 'We couldn’t complete your search.' }),
  ).toBeVisible({ timeout: 22000 })
  expect(cancelled).toBe(6)
  await expect(page.getByRole('button', { name: 'Retry search', exact: true })).toBeVisible()
})
