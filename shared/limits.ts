import type { ItemConfig } from './types'

export const LIMITS = {
  area: { min: 10, max: 500, step: 5 },
  rooms: { min: 1, max: 10 },
  bathrooms: { min: 1, max: 5 },
  sashes: { min: 1, max: 60 },
  extra: { min: 0, max: 10 },
  qty: { min: 1, max: 5 },
  description: { max: 1000 },
  photos: { max: 3, maxBytes: 12 * 1024 * 1024, maxSide: 1600 },
  name: { max: 80 },
  address: { max: 300 },
  comment: { max: 1000 },
  cartItems: 10,
} as const

export const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'] as const

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function defaultConfig(type: ItemConfig['type'] = 'maintenance'): ItemConfig {
  return {
    type,
    area: 50,
    rooms: 2,
    bathrooms: 1,
    sashes: 6,
    balcony: false,
    extras: {},
    frequency: 'once',
    heavyDirt: false,
    description: '',
  }
}

/** Ukrainian mobile/landline in E.164: +380 and 9 digits */
export const PHONE_RE = /^\+380\d{9}$/

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('380')) return `+${digits.slice(0, 12)}`
  if (digits.startsWith('0')) return `+38${digits.slice(0, 10)}`
  return `+380${digits.slice(0, 9)}`
}
