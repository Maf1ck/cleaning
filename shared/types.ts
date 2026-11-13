export const CLEANING_TYPES = ['maintenance', 'general', 'renovation', 'windows', 'other'] as const
export type CleaningType = (typeof CLEANING_TYPES)[number]

export const AREA_TYPES = ['maintenance', 'general', 'renovation'] as const
export type AreaType = (typeof AREA_TYPES)[number]

export const FREQUENCIES = ['once', 'weekly', 'biweekly', 'monthly'] as const
export type Frequency = (typeof FREQUENCIES)[number]
export type RegularFrequency = Exclude<Frequency, 'once'>

export const EXTRA_IDS = ['oven', 'fridge', 'microwave', 'cabinets', 'balcony', 'ironing', 'dishes'] as const
export type ExtraId = (typeof EXTRA_IDS)[number]

export const ORDER_STATUSES = ['new', 'agreed', 'done', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const GAME_MODES = ['off', 'play', 'bonus'] as const
export type GameMode = (typeof GAME_MODES)[number]

export const ACCENTS = ['pine', 'lagoon', 'plum', 'terracotta'] as const
export type Accent = (typeof ACCENTS)[number]

export const PERSONALITIES = ['friendly', 'calm', 'playful'] as const
export type Personality = (typeof PERSONALITIES)[number]

export interface PriceList {
  /** Base price per m² for area-based cleaning types, UAH */
  perM2: Record<AreaType, number>
  /** Window washing: price per sash and flat fee for a balcony/loggia */
  windows: { perSash: number; balcony: number }
  /** Surcharge for every bathroom beyond the first (area-based types) */
  bathroomExtra: number
  /** Fixed price per unit of an extra service */
  extras: Record<ExtraId, number>
  /** Minimum for the cleaning part of the order (travel fee is added on top) */
  minOrder: number
  /** Heavy soiling surcharge, % */
  heavyDirtPct: number
  /** Discount for a regular schedule, % */
  regularDiscountPct: Record<RegularFrequency, number>
  /** Flat fee for a visit outside the city */
  outOfCityFee: number
  /** Round each item to this step, UAH */
  roundTo: number
}

export interface ItemConfig {
  type: CleaningType
  area: number
  rooms: number
  bathrooms: number
  sashes: number
  balcony: boolean
  extras: Partial<Record<ExtraId, number>>
  frequency: Frequency
  heavyDirt: boolean
  description: string
}

export interface CartItem {
  id: string
  config: ItemConfig
  qty: number
}

export interface CompanySettings {
  name: string
  tagline: string
  phone: string
  email: string
  telegram: string
  viber: string
  city: string
  serviceArea: string
  workHours: string
  legalName: string
  accent: Accent
  retentionDays: number
}

export interface GameSettings {
  mode: GameMode
  bonusAmount: number
  validDays: number
  minNextOrder: number
}

export interface CharacterSettings {
  personality: Personality
  faces: boolean
  phrases: boolean
}

export interface PublicSettings {
  company: CompanySettings
  prices: PriceList
  game: GameSettings
  characters: CharacterSettings
}

export interface PriceLine {
  kind: 'base' | 'bathrooms' | 'extra' | 'dirt' | 'discount' | 'rounding'
  label: string
  amount: number
}

export interface ItemEstimate {
  manual: boolean
  lines: PriceLine[]
  unit: number | null
  total: number | null
}

export interface PublicBonus {
  code: string
  amount: number
  minOrder: number
  expiresAt: string | null
  status: string
}

/** What the private order link returns: no phone, address, photos or owner note. */
export interface PublicOrder {
  token: string
  status: OrderStatus
  firstName: string
  outOfCity: boolean
  preferredDate: string | null
  preferredTime: string | null
  items: CartItem[]
  estimate: OrderEstimate
  minOrder: number
  finalPrice: number | null
  agreedAt: string | null
  photoCount: number
  createdAt: string | null
  updatedAt: string | null
  bonus: PublicBonus | null
}

export interface OrderEstimate {
  items: { id: string; qty: number; estimate: ItemEstimate }[]
  knownSum: number
  minimumTopUp: number
  cleaningTotal: number
  travelFee: number
  total: number
  manualCount: number
  hasKnown: boolean
}
