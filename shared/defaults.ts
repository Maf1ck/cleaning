import type { CharacterSettings, CompanySettings, GameSettings, PriceList } from './types'

/** Demo values for a fresh instance. Contacts are empty on purpose: no fake phone numbers. */
export const DEFAULT_COMPANY: CompanySettings = {
  name: 'Прибрано',
  tagline: 'Прибирання з виїздом до вас',
  phone: '',
  email: '',
  telegram: '',
  viber: '',
  city: 'Київ',
  serviceArea: 'Усі райони міста. За місто — з фіксованою доплатою за виїзд.',
  workHours: 'Щодня 08:00–20:00',
  legalName: '',
  accent: 'pine',
  retentionDays: 365,
}

export const DEFAULT_PRICES: PriceList = {
  perM2: { maintenance: 32, general: 62, renovation: 85 },
  windows: { perSash: 120, balcony: 250 },
  bathroomExtra: 200,
  extras: { oven: 350, fridge: 300, microwave: 150, cabinets: 250, balcony: 300, ironing: 250, dishes: 150 },
  minOrder: 1200,
  heavyDirtPct: 25,
  regularDiscountPct: { weekly: 15, biweekly: 10, monthly: 5 },
  outOfCityFee: 300,
  roundTo: 10,
}

export const DEFAULT_GAME: GameSettings = {
  mode: 'play',
  bonusAmount: 150,
  validDays: 60,
  minNextOrder: 1500,
}

export const DEFAULT_CHARACTERS: CharacterSettings = {
  personality: 'friendly',
  faces: true,
  phrases: true,
}
