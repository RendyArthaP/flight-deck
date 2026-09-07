import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
const browser = await chromium.launch()
const base = process.env.FLIGHTDECK_CAPTURE_URL || 'http://127.0.0.1:3200'
const search =
  '/flights?from=CGK&to=SIN&departure=2027-10-13&return=2027-10-16&adults=1&children=0&cabin=economy'
try {
  await mkdir('docs/screenshots', { recursive: true })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: 'reduce',
  })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(base, { waitUntil: 'networkidle' })
  await expect(page.getByRole('combobox', { name: 'To', exact: true })).toHaveValue('Singapore')
  await page.screenshot({ path: 'docs/screenshots/home-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'docs/screenshots/home-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1100 })
  const searchStart = performance.now()
  await page.goto(base + search)
  await expect(page.locator('.flight-card').first()).toBeVisible()
  const firstResultMs = Math.round(performance.now() - searchStart)
  await expect(page.getByRole('heading', { name: '580 flights found', exact: true })).toBeVisible()
  const completeMs = Math.round(performance.now() - searchStart)
  await page.screenshot({ path: 'docs/screenshots/results-desktop.png' })
  const dom = await page.evaluate(() => ({
    elements: document.querySelectorAll('*').length,
    cards: document.querySelectorAll('.flight-card').length,
  }))
  await page.getByRole('button', { name: 'Flight details', exact: true }).first().click()
  await expect(
    page
      .getByRole('dialog', { name: 'Flight details' })
      .getByText('Return journey', { exact: true }),
  ).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/details-desktop.png' })
  await page.getByRole('button', { name: 'Select this itinerary' }).click()
  await expect(page.getByRole('heading', { name: 'Your itinerary.' })).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/review-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'docs/screenshots/review-mobile.png', fullPage: true })
  await page.goto(base + search)
  await expect(page.locator('.flight-card').first()).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/results-mobile.png' })
  await expect(page.getByRole('heading', { name: '580 flights found', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Refine your search' })).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/filters-mobile.png' })
  const result = {
    environment:
      'Local production server, Chromium, 1440x1100; single unthrottled sample including simulated delays and automation overhead',
    firstResultMs,
    completeMs,
    ...dom,
    pageErrors: errors,
  }
  await writeFile('docs/screenshots/measurement.json', JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
} finally {
  await browser.close()
}
