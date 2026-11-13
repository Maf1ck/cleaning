import { describe, expect, it } from 'vitest'
import { configKey, estimateItem, estimateOrder, isItemConfig, normalizeConfig, roundTo } from '../shared/pricing'
import { defaultConfig } from '../shared/limits'
import { DEFAULT_PRICES } from '../shared/defaults'
import type { ItemConfig, PriceList } from '../shared/types'

const prices: PriceList = structuredClone(DEFAULT_PRICES)
const cfg = (patch: Partial<ItemConfig>): ItemConfig => ({ ...defaultConfig(patch.type ?? 'maintenance'), ...patch })

describe('estimateItem', () => {
  it('base × area, rounded to 10', () => {
    // 47 m² × 32 = 1504 → 1500
    const e = estimateItem(cfg({ type: 'maintenance', area: 47 }), prices)
    expect(e.unit).toBe(1500)
    expect(e.lines.at(-1)?.kind).toBe('rounding')
  })

  it('applies extras → dirt → discount → rounding in that order', () => {
    // general 60 m² × 62 = 3720; 2nd bathroom +200 → 3920; oven 350 + fridge 300 → 4570
    // dirt 25% → 5712.5; weekly −15% → 4855.625 → 4860
    const e = estimateItem(cfg({ type: 'general', area: 60, bathrooms: 2, extras: { oven: 1, fridge: 1 }, heavyDirt: true, frequency: 'weekly' }), prices)
    expect(e.lines.map((l) => l.kind)).toEqual(['base', 'bathrooms', 'extra', 'extra', 'dirt', 'discount', 'rounding'])
    expect(e.lines.find((l) => l.kind === 'dirt')?.amount).toBe(1142.5)
    expect(e.lines.find((l) => l.kind === 'discount')?.amount).toBe(-856.88)
    expect(e.unit).toBe(4860)
  })

  it('windows use sashes and balcony instead of area', () => {
    const e = estimateItem(cfg({ type: 'windows', sashes: 8, balcony: true, area: 300 }), prices)
    // 8 × 120 + 250 = 1210 → 1210
    expect(e.unit).toBe(1210)
    expect(e.lines.some((l) => l.label.includes('м²'))).toBe(false)
  })

  it('"other" is manual and never priced as zero', () => {
    const e = estimateItem(cfg({ type: 'other', description: 'Помити сходи в підʼїзді' }), prices)
    expect(e.manual).toBe(true)
    expect(e.unit).toBeNull()
    expect(e.total).toBeNull()
  })

  it('clamps out-of-range values', () => {
    const n = normalizeConfig(cfg({ type: 'maintenance', area: 99999, rooms: -3, extras: { oven: 50 } }))
    expect(n.area).toBe(500)
    expect(n.rooms).toBe(1)
    expect(n.extras.oven).toBe(10)
  })
})

describe('estimateOrder', () => {
  it('tops up to the minimum, travel fee goes on top', () => {
    // 20 m² × 32 = 640 < 1200 → top-up 560; out of city +300
    const o = estimateOrder([{ id: 'a', qty: 1, config: cfg({ area: 20 }) }], prices, true)
    expect(o.knownSum).toBe(640)
    expect(o.minimumTopUp).toBe(560)
    expect(o.cleaningTotal).toBe(1200)
    expect(o.travelFee).toBe(300)
    expect(o.total).toBe(1500)
  })

  it('mixed order separates known sum and manual items', () => {
    const o = estimateOrder(
      [
        { id: 'a', qty: 1, config: cfg({ type: 'general', area: 60 }) },
        { id: 'b', qty: 1, config: cfg({ type: 'windows', sashes: 6 }) },
        { id: 'c', qty: 1, config: cfg({ type: 'other', description: 'Тераса після зими' }) },
      ],
      prices,
      false,
    )
    // 3720 + 720 = 4440
    expect(o.knownSum).toBe(4440)
    expect(o.manualCount).toBe(1)
    expect(o.minimumTopUp).toBe(0)
    expect(o.total).toBe(4440)
  })

  it('only manual items: no minimum applied, total is just travel', () => {
    const o = estimateOrder([{ id: 'c', qty: 1, config: cfg({ type: 'other', description: 'Офіс 30 м²' }) }], prices, false)
    expect(o.hasKnown).toBe(false)
    expect(o.minimumTopUp).toBe(0)
    expect(o.total).toBe(0)
  })

  it('quantity multiplies the rounded unit', () => {
    const o = estimateOrder([{ id: 'a', qty: 2, config: cfg({ area: 47 }) }], prices, false)
    expect(o.items[0]!.estimate.total).toBe(3000)
  })

  it('regular discount differs by frequency', () => {
    const base = cfg({ type: 'maintenance', area: 100 }) // 3200
    expect(estimateItem({ ...base, frequency: 'weekly' }, prices).unit).toBe(2720)
    expect(estimateItem({ ...base, frequency: 'biweekly' }, prices).unit).toBe(2880)
    expect(estimateItem({ ...base, frequency: 'monthly' }, prices).unit).toBe(3040)
  })
})

describe('configKey', () => {
  it('ignores fields that do not apply to the type', () => {
    const a = cfg({ type: 'windows', sashes: 4, area: 40 })
    const b = cfg({ type: 'windows', sashes: 4, area: 120, rooms: 5 })
    expect(configKey(a)).toBe(configKey(b))
  })

  it('distinguishes different settings', () => {
    expect(configKey(cfg({ area: 40 }))).not.toBe(configKey(cfg({ area: 45 })))
    expect(configKey(cfg({ extras: { oven: 1 } }))).not.toBe(configKey(cfg({ extras: {} })))
  })

  it('zero extras equal absent extras', () => {
    expect(configKey(cfg({ extras: { oven: 0 } }))).toBe(configKey(cfg({ extras: {} })))
  })
})

describe('isItemConfig', () => {
  it('accepts a valid config and rejects tampered storage', () => {
    expect(isItemConfig(cfg({}))).toBe(true)
    expect(isItemConfig({ ...cfg({}), type: 'spa' })).toBe(false)
    expect(isItemConfig({ ...cfg({}), area: '50' })).toBe(false)
    expect(isItemConfig(null)).toBe(false)
  })
})

describe('roundTo', () => {
  it('rounds half up to the step', () => {
    expect(roundTo(1505, 10)).toBe(1510)
    expect(roundTo(1504.9, 10)).toBe(1500)
    expect(roundTo(1504.4, 1)).toBe(1504)
  })
})
