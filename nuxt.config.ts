import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  typescript: {
    strict: true,
    // These application folders live outside Nuxt's default app/ directory.
    tsConfig: {
      include: [
        fileURLToPath(new URL('./features/**/*', import.meta.url)),
        fileURLToPath(new URL('./stores/**/*', import.meta.url)),
      ],
    },
    nodeTsConfig: {
      include: [
        fileURLToPath(new URL('./vitest.config.ts', import.meta.url)),
        fileURLToPath(new URL('./playwright.config.ts', import.meta.url)),
      ],
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'FlightDeck — Find the right flight, faster.',
      meta: [
        {
          name: 'description',
          content:
            'A little less searching. A little more going. Discover your next journey with FlightDeck.',
        },
        { name: 'theme-color', content: '#f7f7f2' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
