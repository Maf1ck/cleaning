import { defineStore } from 'pinia'

const STORAGE_KEY = 'prybrano:draft:v1'

export interface DraftPhoto {
  token: string
  thumb: string
  name: string
}

export interface CheckoutDraft {
  name: string
  phone: string
  address: string
  outOfCity: boolean
  preferredDate: string
  preferredTime: string
  comment: string
  consent: boolean
  photos: DraftPhoto[]
  idempotencyKey: string
}

function newKey(): string {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const empty = (): CheckoutDraft => ({
  name: '',
  phone: '+380',
  address: '',
  outOfCity: false,
  preferredDate: '',
  preferredTime: '',
  comment: '',
  consent: false,
  photos: [],
  idempotencyKey: '',
})

/** Checkout form draft, kept in this browser so a reload does not lose typed data. */
export const useDraftStore = defineStore('draft', () => {
  const draft = ref<CheckoutDraft>(empty())
  const ready = ref(false)

  function restore(): void {
    if (!import.meta.client || ready.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CheckoutDraft>
        const base = empty()
        draft.value = {
          ...base,
          ...Object.fromEntries(Object.entries(parsed).filter(([k, v]) => k in base && typeof v === typeof base[k as keyof CheckoutDraft])),
          photos: Array.isArray(parsed.photos) ? parsed.photos.filter((p) => typeof p?.token === 'string').slice(0, 3) : [],
        }
      }
    } catch {
      draft.value = empty()
    }
    ready.value = true
  }

  watch(
    draft,
    (value) => {
      if (!import.meta.client || !ready.value) return
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } catch {
        // Quota exceeded (thumbnails): keep working without persistence.
      }
    },
    { deep: true },
  )

  /** The same key is reused for every retry until the order is stored. */
  function ensureKey(): string {
    if (!draft.value.idempotencyKey) draft.value.idempotencyKey = newKey()
    return draft.value.idempotencyKey
  }

  function reset(): void {
    draft.value = empty()
  }

  return { draft, ready, restore, ensureKey, reset }
})
