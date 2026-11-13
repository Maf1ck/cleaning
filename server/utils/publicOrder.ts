import type { H3Event } from 'h3'
import type { PublicBonus } from '#shared/types'
import type { OrderRow } from './orders'

export async function loadPublicOrder(event: H3Event) {
  const token = getRouterParam(event, 'token') ?? ''
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) throw createError({ statusCode: 404, message: 'Заявку не знайдено' })
  const db = await useDb()
  const rows = await db.query<OrderRow>('SELECT * FROM orders WHERE public_token = $1', [token])
  const row = rows[0]
  if (!row) throw createError({ statusCode: 404, message: 'Заявку не знайдено' })
  const photos = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM uploads WHERE order_id = $1', [row.id])
  const bonusRows = await db.query<{ code: string; amount: number; min_order: number; expires_at: Date | string; status: string }>(
    'SELECT code, amount, min_order, expires_at, status FROM bonus_codes WHERE order_id = $1',
    [row.id],
  )
  const b = bonusRows[0]
  const bonus: PublicBonus | null = b ? { code: b.code, amount: b.amount, minOrder: b.min_order, expiresAt: isoOrNull(b.expires_at), status: b.status } : null
  return { db, row, view: publicOrderView(row, photos[0]?.n ?? 0, bonus) }
}
