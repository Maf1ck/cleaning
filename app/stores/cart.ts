import { defineStore } from 'pinia'
import { configKey, estimateOrder, isItemConfig, normalizeConfig } from '#shared/pricing'
import { LIMITS } from '#shared/limits'
import type { CartItem, ItemConfig } from '#shared/types'

const STORAGE_KEY = 'prybrano:cart:v1'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export interface RemovedItem {
  item: CartItem
  index: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const ready = ref(false)

  const count = computed(() => items.value.reduce((n, i) => n + i.qty, 0))

  function persist(): void {
    if (!import.meta.client || !ready.value) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    } catch {
      // Storage full or blocked: the cart still works for this visit.
    }
  }

  function restore(): void {
    if (!import.meta.client || ready.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) {
        items.value = parsed
          .filter((i): i is CartItem => typeof i === 'object' && i !== null && 'config' in i && isItemConfig((i as CartItem).config))
          .map((i) => ({ id: String(i.id), qty: Math.min(LIMITS.qty.max, Math.max(1, Number(i.qty) || 1)), config: normalizeConfig(i.config) }))
          .slice(0, LIMITS.cartItems)
      }
    } catch {
      items.value = []
    }
    ready.value = true
  }

  watch(items, persist, { deep: true })

  /** Adds a configured service. Identical settings merge into one line (qty + 1). */
  function add(config: ItemConfig): { id: string; merged: boolean } {
    const normalized = normalizeConfig(config)
    const key = configKey(normalized)
    const same = items.value.find((i) => configKey(i.config) === key)
    if (same) {
      same.qty = Math.min(LIMITS.qty.max, same.qty + 1)
      return { id: same.id, merged: true }
    }
    const id = uid()
    items.value.push({ id, qty: 1, config: normalized })
    return { id, merged: false }
  }

  /** Replaces the settings of a line; if it becomes identical to another line they merge. */
  function update(id: string, config: ItemConfig): { id: string; merged: boolean } {
    const target = items.value.find((i) => i.id === id)
    if (!target) return add(config)
    const normalized = normalizeConfig(config)
    const key = configKey(normalized)
    const twin = items.value.find((i) => i.id !== id && configKey(i.config) === key)
    if (twin) {
      twin.qty = Math.min(LIMITS.qty.max, twin.qty + target.qty)
      items.value = items.value.filter((i) => i.id !== id)
      return { id: twin.id, merged: true }
    }
    target.config = normalized
    return { id, merged: false }
  }

  function setQty(id: string, qty: number): void {
    const target = items.value.find((i) => i.id === id)
    if (target) target.qty = Math.min(LIMITS.qty.max, Math.max(LIMITS.qty.min, Math.round(qty)))
  }

  function remove(id: string): RemovedItem | null {
    const index = items.value.findIndex((i) => i.id === id)
    if (index < 0) return null
    const [item] = items.value.splice(index, 1)
    return item ? { item, index } : null
  }

  function undoRemove(removed: RemovedItem): void {
    if (items.value.some((i) => i.id === removed.item.id)) return
    items.value.splice(Math.min(removed.index, items.value.length), 0, removed.item)
  }

  function clear(): void {
    items.value = []
  }

  function byId(id: string): CartItem | undefined {
    return items.value.find((i) => i.id === id)
  }

  function estimate(outOfCity: boolean) {
    const settings = useSettings()
    return estimateOrder(items.value, settings.value.prices, outOfCity)
  }

  return { items, ready, count, restore, add, update, setQty, remove, undoRemove, clear, byId, estimate }
})
