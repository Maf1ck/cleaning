import type { H3Event } from 'h3'
import type { OrderRow } from './orders'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function orderIdParam(event: H3Event): string {
  const id = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(id)) throw createError({ statusCode: 404, message: 'Заявку не знайдено' })
  return id
}

export async function adminOrderView(id: string) {
  const db = await useDb()
  const rows = await db.query<OrderRow>('SELECT * FROM orders WHERE id = $1', [id])
  const r = rows[0]
  if (!r) throw createError({ statusCode: 404, message: 'Заявку не знайдено' })
  const photos = await db.query<{ id: string; width: number; height: number; size: number }>(
    'SELECT id, width, height, size FROM uploads WHERE order_id = $1 ORDER BY created_at',
    [id],
  )
  const events = await db.query<{ id: number; kind: string; data: Record<string, unknown>; created_at: Date | string }>(
    'SELECT id, kind, data, created_at FROM order_events WHERE order_id = $1 ORDER BY created_at, id',
    [id],
  )
  const bonus = await db.query<{ code: string; amount: number; min_order: number; expires_at: Date | string; status: string }>(
    'SELECT code, amount, min_order, expires_at, status FROM bonus_codes WHERE order_id = $1',
    [id],
  )
  const b = bonus[0]
  return {
    id: r.id,
    token: r.public_token,
    status: r.status,
    name: r.customer_name,
    phone: r.customer_phone,
    address: r.address,
    outOfCity: r.out_of_city,
    preferredDate: dateOnly(r.preferred_date),
    preferredTime: r.preferred_time,
    comment: r.comment,
    items: r.items,
    priceSnapshot: r.price_snapshot,
    estimate: r.estimate,
    finalPrice: r.final_price,
    agreedAt: isoOrNull(r.agreed_at),
    ownerNote: r.owner_note,
    anonymized: r.anonymized_at !== null,
    createdAt: isoOrNull(r.created_at),
    updatedAt: isoOrNull(r.updated_at),
    photos: photos.map((p) => ({ id: p.id, width: p.width, height: p.height, size: p.size })),
    events: events.map((e) => ({ id: Number(e.id), kind: e.kind, data: e.data, at: isoOrNull(e.created_at) })),
    bonus: b ? { code: b.code, amount: b.amount, minOrder: b.min_order, expiresAt: isoOrNull(b.expires_at), status: b.status } : null,
  }
}

export type AdminOrder = Awaited<ReturnType<typeof adminOrderView>>
