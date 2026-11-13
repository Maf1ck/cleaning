/**
 * Single source of truth for price calculation. Used by the browser for the live
 * estimate and by the server, which recalculates every order and ignores any sum
 * sent by the client.
 *
 * Order of operations for one item (documented in docs/PRICING.md):
 *   1. base       = price per m² × area           (windows: per sash × sashes + balcony)
 *   2. bathrooms  = surcharge × (bathrooms − 1)    (area-based types only)
 *   3. extras     = Σ unit price × quantity
 *   4. dirt       = (1 + 2 + 3) × heavy-dirt %     (if heavy soiling)
 *   5. discount   = (1 + 2 + 3 + 4) × regular %    (weekly / biweekly / monthly)
 *   6. unit       = round to `roundTo` UAH (half up)
 *   7. item total = unit × quantity
 * Order level:
 *   known sum     = Σ item totals of priced items ("Інше" is estimated manually)
 *   minimum       = if 0 < known sum < minOrder → top up to minOrder
 *   travel fee    = added on top of the minimum when the address is outside the city
 */
import { AREA_TYPES, CLEANING_TYPES, EXTRA_IDS, FREQUENCIES } from './types'
import type { AreaType, CartItem, ExtraId, ItemConfig, ItemEstimate, OrderEstimate, PriceLine, PriceList } from './types'
import { LIMITS, clamp } from './limits'
import { EXTRA_LABELS, FREQUENCY_LABELS, TYPE_LABELS } from './content/services'

/** Cheap structural check for configs read back from localStorage (no zod in the client bundle). */
export function isItemConfig(value: unknown): value is ItemConfig {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    (CLEANING_TYPES as readonly unknown[]).includes(v.type) &&
    (FREQUENCIES as readonly unknown[]).includes(v.frequency) &&
    ['area', 'rooms', 'bathrooms', 'sashes'].every((k) => typeof v[k] === 'number' && Number.isFinite(v[k])) &&
    typeof v.balcony === 'boolean' &&
    typeof v.heavyDirt === 'boolean' &&
    typeof v.description === 'string' &&
    typeof v.extras === 'object' &&
    v.extras !== null
  )
}

export function isAreaType(type: ItemConfig['type']): type is AreaType {
  return (AREA_TYPES as readonly string[]).includes(type)
}

/** Drops fields that do not apply to the chosen type so equal orders compare equal. */
export function normalizeConfig(input: ItemConfig): ItemConfig {
  const extras: Partial<Record<ExtraId, number>> = {}
  if (input.type !== 'other') {
    for (const id of EXTRA_IDS) {
      const n = Math.round(clamp(Number(input.extras[id] ?? 0), LIMITS.extra.min, LIMITS.extra.max))
      if (n > 0) extras[id] = n
    }
  }
  const area = isAreaType(input.type)
  return {
    type: input.type,
    area: area ? Math.round(clamp(input.area, LIMITS.area.min, LIMITS.area.max)) : 0,
    rooms: area ? Math.round(clamp(input.rooms, LIMITS.rooms.min, LIMITS.rooms.max)) : 0,
    bathrooms: area ? Math.round(clamp(input.bathrooms, LIMITS.bathrooms.min, LIMITS.bathrooms.max)) : 0,
    sashes: input.type === 'windows' ? Math.round(clamp(input.sashes, LIMITS.sashes.min, LIMITS.sashes.max)) : 0,
    balcony: input.type === 'windows' ? Boolean(input.balcony) : false,
    extras,
    frequency: input.type === 'other' ? 'once' : input.frequency,
    heavyDirt: input.type === 'other' ? false : Boolean(input.heavyDirt),
    description: input.type === 'other' ? input.description.trim().slice(0, LIMITS.description.max) : '',
  }
}

/** Stable key: identical settings → identical key → merged in the cart. */
export function configKey(config: ItemConfig): string {
  const c = normalizeConfig(config)
  const extras = EXTRA_IDS.filter((id) => c.extras[id]).map((id) => `${id}:${c.extras[id]}`).join(',')
  return [c.type, c.area, c.rooms, c.bathrooms, c.sashes, c.balcony ? 1 : 0, extras, c.frequency, c.heavyDirt ? 1 : 0, c.description].join('|')
}

export function roundTo(value: number, step: number): number {
  if (step <= 1) return Math.round(value)
  return Math.round(value / step) * step
}

const money = (n: number): number => Math.round(n * 100) / 100

export function estimateItem(raw: ItemConfig, prices: PriceList): ItemEstimate {
  const c = normalizeConfig(raw)
  if (c.type === 'other') return { manual: true, lines: [], unit: null, total: null }

  const lines: PriceLine[] = []
  if (isAreaType(c.type)) {
    lines.push({ kind: 'base', label: `${TYPE_LABELS[c.type]}: ${c.area} м² × ${prices.perM2[c.type]} ₴`, amount: money(c.area * prices.perM2[c.type]) })
    if (c.bathrooms > 1 && prices.bathroomExtra > 0) {
      const n = c.bathrooms - 1
      lines.push({ kind: 'bathrooms', label: `Додаткові санвузли: ${n} × ${prices.bathroomExtra} ₴`, amount: money(n * prices.bathroomExtra) })
    }
  } else {
    lines.push({ kind: 'base', label: `Миття вікон: ${c.sashes} стул. × ${prices.windows.perSash} ₴`, amount: money(c.sashes * prices.windows.perSash) })
    if (c.balcony) lines.push({ kind: 'base', label: 'Балкон або лоджія', amount: money(prices.windows.balcony) })
  }

  for (const id of EXTRA_IDS) {
    const qty = c.extras[id] ?? 0
    if (qty > 0) lines.push({ kind: 'extra', label: `${EXTRA_LABELS[id].title}: ${qty} × ${prices.extras[id]} ₴`, amount: money(qty * prices.extras[id]) })
  }

  let running = lines.reduce((sum, l) => sum + l.amount, 0)

  if (c.heavyDirt && prices.heavyDirtPct > 0) {
    const dirt = money((running * prices.heavyDirtPct) / 100)
    lines.push({ kind: 'dirt', label: `Сильне забруднення +${prices.heavyDirtPct}%`, amount: dirt })
    running += dirt
  }

  if (c.frequency !== 'once') {
    const pct = prices.regularDiscountPct[c.frequency]
    if (pct > 0) {
      const discount = money((running * pct) / 100)
      lines.push({ kind: 'discount', label: `${FREQUENCY_LABELS[c.frequency]}: знижка ${pct}%`, amount: -discount })
      running -= discount
    }
  }

  const unit = roundTo(running, prices.roundTo)
  const delta = money(unit - running)
  if (delta !== 0) lines.push({ kind: 'rounding', label: `Заокруглення до ${prices.roundTo} ₴`, amount: delta })

  return { manual: false, lines, unit, total: unit }
}

export function estimateOrder(items: Pick<CartItem, 'id' | 'config' | 'qty'>[], prices: PriceList, outOfCity: boolean): OrderEstimate {
  const rows = items.map((item) => {
    const qty = Math.round(clamp(item.qty, LIMITS.qty.min, LIMITS.qty.max))
    const est = estimateItem(item.config, prices)
    return { id: item.id, qty, estimate: { ...est, total: est.unit === null ? null : est.unit * qty } }
  })
  const knownSum = rows.reduce((sum, r) => sum + (r.estimate.total ?? 0), 0)
  const hasKnown = rows.some((r) => !r.estimate.manual)
  const minimumTopUp = hasKnown && knownSum < prices.minOrder ? prices.minOrder - knownSum : 0
  const cleaningTotal = knownSum + minimumTopUp
  const travelFee = outOfCity ? prices.outOfCityFee : 0
  return {
    items: rows,
    knownSum,
    minimumTopUp,
    cleaningTotal,
    travelFee,
    total: cleaningTotal + travelFee,
    manualCount: rows.filter((r) => r.estimate.manual).length,
    hasKnown,
  }
}

export function formatUah(value: number): string {
  return `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(Math.round(value))} ₴`
}

/** Short tariff label for a type card: "32 ₴/м²", "120 ₴/стулка", "за фото". */
export function rateLabel(type: ItemConfig['type'], prices: PriceList): string {
  if (type === 'other') return 'за фото'
  if (type === 'windows') return `${formatUah(prices.windows.perSash)}/стулка`
  return `${formatUah(prices.perM2[type])}/м²`
}
