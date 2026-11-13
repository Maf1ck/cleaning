import { randomUUID } from 'node:crypto'
import { orderInputSchema } from '#shared/schemas'
import { estimateOrder, normalizeConfig } from '#shared/pricing'
import type { StoredItem } from '../utils/orders'

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

function todayIso(): string {
  return new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event)
  const db = await useDb()

  // A retry after a network failure must return the same order, not create a second one.
  const key = typeof body === 'object' && body !== null && 'idempotencyKey' in body ? String((body as { idempotencyKey: unknown }).idempotencyKey) : ''
  if (key) {
    const existing = await db.query<{ public_token: string }>('SELECT public_token FROM orders WHERE idempotency_key = $1', [key])
    if (existing[0]) return { token: existing[0].public_token, duplicate: true }
  }

  await rateLimit(event, 'order', 8, 600)

  const parsed = orderInputSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: 'Перевірте поля форми', data: { fields: fieldErrors(parsed.error.issues) } })
  }
  const input = parsed.data

  if (input.preferredDate) {
    const max = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    if (input.preferredDate < todayIso() || input.preferredDate > max) {
      throw createError({ statusCode: 422, message: 'Перевірте дату', data: { fields: { preferredDate: 'Оберіть дату від сьогодні до півроку вперед' } } })
    }
  }

  // Never trust the browser's sum: recalculate with the current price list and store
  // both the price list and the result, so later price changes do not alter this order.
  const prices = await getSetting('prices')
  const items: StoredItem[] = input.items.map((item, index) => ({
    id: `i${index + 1}`,
    qty: item.qty,
    config: normalizeConfig(item.config),
  }))
  const estimate = estimateOrder(items, prices, input.customer.outOfCity)

  const tokens = [...new Set(input.photoTokens)]
  if (tokens.length) {
    const found = await db.query<{ token: string }>(
      `SELECT token FROM uploads WHERE order_id IS NULL AND created_at > now() - interval '1 day' AND token IN (${tokens.map((_, i) => `$${i + 1}`).join(', ')})`,
      tokens,
    )
    if (found.length !== tokens.length) {
      throw createError({ statusCode: 422, message: 'Фото застаріли', data: { fields: { photoTokens: 'Деякі фото не знайдено. Завантажте їх ще раз.' } } })
    }
  }

  const id = randomUUID()
  const publicToken = randomToken(24)

  const result = await db.tx(async (t) => {
    const inserted = await t.query<{ public_token: string }>(
      `INSERT INTO orders (id, public_token, idempotency_key, customer_name, customer_phone, address, out_of_city,
         preferred_date, preferred_time, comment, items, price_snapshot, estimate, consent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, now())
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING public_token`,
      [
        id,
        publicToken,
        input.idempotencyKey,
        input.customer.name,
        input.customer.phone,
        input.customer.address,
        input.customer.outOfCity,
        input.preferredDate || null,
        input.preferredTime || null,
        input.comment,
        JSON.stringify(items),
        JSON.stringify(prices),
        JSON.stringify(estimate),
      ],
    )
    if (!inserted[0]) return null
    for (const token of tokens) {
      await t.query('UPDATE uploads SET order_id = $1 WHERE token = $2 AND order_id IS NULL', [id, token])
    }
    await logEvent(t, id, 'created', { total: estimate.total, manual: estimate.manualCount })
    return inserted[0].public_token
  })

  if (!result) {
    // Lost the race with a parallel retry using the same key.
    const existing = await db.query<{ public_token: string }>('SELECT public_token FROM orders WHERE idempotency_key = $1', [input.idempotencyKey])
    return { token: existing[0]?.public_token ?? '', duplicate: true }
  }
  setResponseStatus(event, 201)
  return { token: result, duplicate: false }
})
