import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  // A separate client per SSR request prevents cache leakage between visitors.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
  })
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})
