import { DEFAULT_CHARACTERS, DEFAULT_COMPANY, DEFAULT_GAME, DEFAULT_PRICES } from '#shared/defaults'
import type { PublicSettings } from '#shared/types'

const fallback = (): PublicSettings => ({
  company: structuredClone(DEFAULT_COMPANY),
  prices: structuredClone(DEFAULT_PRICES),
  game: structuredClone(DEFAULT_GAME),
  characters: structuredClone(DEFAULT_CHARACTERS),
})

export function useSettings() {
  return useState<PublicSettings>('settings', fallback)
}

export async function refreshSettings(): Promise<void> {
  const state = useSettings()
  try {
    state.value = await $fetch<PublicSettings>('/api/settings')
  } catch {
    // Keep defaults: the order flow still works with the built-in price list,
    // and the server recalculates the real price anyway.
  }
}
