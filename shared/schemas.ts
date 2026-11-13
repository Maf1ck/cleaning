import { z } from 'zod'
import { ACCENTS, CLEANING_TYPES, FREQUENCIES, GAME_MODES, ORDER_STATUSES, PERSONALITIES } from './types'
import { LIMITS, PHONE_RE, TIME_SLOTS } from './limits'

const price = z.number().min(0).max(100000)
const pct = z.number().min(0).max(90)

export const priceListSchema = z.object({
  perM2: z.object({ maintenance: price, general: price, renovation: price }),
  windows: z.object({ perSash: price, balcony: price }),
  bathroomExtra: price,
  extras: z.object({
    oven: price,
    fridge: price,
    microwave: price,
    cabinets: price,
    balcony: price,
    ironing: price,
    dishes: price,
  }),
  minOrder: price,
  heavyDirtPct: z.number().min(0).max(200),
  regularDiscountPct: z.object({ weekly: pct, biweekly: pct, monthly: pct }),
  outOfCityFee: price,
  roundTo: z.union([z.literal(1), z.literal(5), z.literal(10), z.literal(50), z.literal(100)]),
})

const optionalUrlish = z.string().trim().max(200)

export const companySchema = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(140),
  phone: z.union([z.literal(''), z.string().regex(PHONE_RE, 'Телефон у форматі +380XXXXXXXXX')]),
  email: z.union([z.literal(''), z.email().max(120)]),
  telegram: optionalUrlish.regex(/^$|^[A-Za-z0-9_]{5,32}$/, 'Лише імʼя користувача без @'),
  viber: z.union([z.literal(''), z.string().regex(PHONE_RE, 'Номер Viber у форматі +380XXXXXXXXX')]),
  city: z.string().trim().min(1).max(80),
  serviceArea: z.string().trim().max(300),
  workHours: z.string().trim().max(80),
  legalName: z.string().trim().max(160),
  accent: z.enum(ACCENTS),
  retentionDays: z.number().int().min(30).max(3650),
})

export const gameSchema = z.object({
  mode: z.enum(GAME_MODES),
  bonusAmount: z.number().int().min(0).max(5000),
  validDays: z.number().int().min(1).max(365),
  minNextOrder: z.number().int().min(0).max(100000),
})

export const charactersSchema = z.object({
  personality: z.enum(PERSONALITIES),
  faces: z.boolean(),
  phrases: z.boolean(),
})

const count = (min: number, max: number) => z.number().int().min(min).max(max)

export const itemConfigSchema = z.object({
  type: z.enum(CLEANING_TYPES),
  area: z.number().min(0).max(LIMITS.area.max),
  rooms: count(0, LIMITS.rooms.max),
  bathrooms: count(0, LIMITS.bathrooms.max),
  sashes: count(0, LIMITS.sashes.max),
  balcony: z.boolean(),
  extras: z.object({
    oven: count(0, LIMITS.extra.max).optional(),
    fridge: count(0, LIMITS.extra.max).optional(),
    microwave: count(0, LIMITS.extra.max).optional(),
    cabinets: count(0, LIMITS.extra.max).optional(),
    balcony: count(0, LIMITS.extra.max).optional(),
    ironing: count(0, LIMITS.extra.max).optional(),
    dishes: count(0, LIMITS.extra.max).optional(),
  }),
  frequency: z.enum(FREQUENCIES),
  heavyDirt: z.boolean(),
  description: z.string().max(LIMITS.description.max),
})

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const orderInputSchema = z
  .object({
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
    items: z
      .array(z.object({ id: z.string().max(64), qty: count(LIMITS.qty.min, LIMITS.qty.max), config: itemConfigSchema }))
      .min(1)
      .max(LIMITS.cartItems),
    customer: z.object({
      name: z.string().trim().min(2, 'Вкажіть імʼя').max(LIMITS.name.max),
      phone: z.string().regex(PHONE_RE, 'Телефон у форматі +380XXXXXXXXX'),
      address: z.string().trim().min(5, 'Вкажіть адресу').max(LIMITS.address.max),
      outOfCity: z.boolean(),
    }),
    preferredDate: z.union([z.literal(''), isoDate]),
    preferredTime: z.union([z.literal(''), z.enum(TIME_SLOTS)]),
    comment: z.string().trim().max(LIMITS.comment.max),
    photoTokens: z.array(z.string().regex(/^[A-Za-z0-9_-]{20,64}$/)).max(LIMITS.photos.max),
    consent: z.literal(true, 'Потрібна згода на обробку даних'),
  })
  .superRefine((value, ctx) => {
    if (value.preferredTime && !value.preferredDate) {
      ctx.addIssue({ code: 'custom', path: ['preferredDate'], message: 'Для конкретного часу оберіть дату' })
    }
    const other = value.items.filter((i) => i.config.type === 'other')
    if (other.length > 0 && value.photoTokens.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['photoTokens'], message: 'Для «Інше» додайте хоча б одне фото' })
    }
    for (const [index, item] of other.entries()) {
      if (item.config.description.trim().length < 5) {
        ctx.addIssue({ code: 'custom', path: ['items', index, 'config', 'description'], message: 'Опишіть задачу для «Інше»' })
      }
    }
  })

export type OrderInput = z.infer<typeof orderInputSchema>

export const adminOrderPatchSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  finalPrice: z.number().int().min(0).max(1000000).nullable().optional(),
  agreedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  ownerNote: z.string().max(4000).optional(),
})

export const passwordChangeSchema = z.object({
  current: z.string().min(1).max(200),
  next: z.string().min(10, 'Мінімум 10 символів').max(200),
})
