import { computed, onMounted, ref, type ComputedRef } from 'vue'
import { useQueries } from '@tanstack/vue-query'
import { providers } from '#shared/contracts/flights'
import { searchProvider } from '../api/flights'
import type { SearchDraft } from '../schemas/search'
import { deduplicate } from '../utils/results'
export function useFlightSearch(criteria: ComputedRef<SearchDraft | undefined>) {
  const mounted = ref(false)
  onMounted(() => {
    mounted.value = true
  })
  const queries = useQueries({
    queries: computed(() => {
      const search = criteria.value
      return providers.map((provider) => ({
        queryKey: ['flights', search, provider],
        queryFn: ({ signal }: { signal: AbortSignal }) => {
          if (!search) throw new Error('Invalid search')
          return searchProvider(search, provider, signal)
        },
        enabled: mounted.value && !!search,
        retry: 1,
        retryDelay: 500,
        staleTime: 300000,
      }))
    }),
  })
  const flights = computed(() => deduplicate(queries.value.flatMap((q) => q.data || [])))
  const loading = computed(() => queries.value.some((q) => q.isPending || q.isFetching))
  const failures = computed(() => queries.value.filter((q) => q.isError).length)
  const retry = () => Promise.all(queries.value.filter((q) => q.isError).map((q) => q.refetch()))
  return { flights, loading, failures, retry }
}
