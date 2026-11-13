import type { ItemConfig, OrderEstimate, OrderStatus, PriceList, PublicBonus, PublicOrder } from '#shared/types'
import type { Db } from './db'

export interface StoredItem {
  id: string
  qty: number
  config: ItemConfig
}

export interface OrderRow {
  id: string
  public_token: string
  status: OrderStatus
  customer_name: string
  customer_phone: string
  address: string
  out_of_city: boolean
  preferred_date: string | Date | null
  preferred_time: string | null
  comment: string
  items: StoredItem[]
  price_snapshot: PriceList
  estimate: OrderEstimate
  final_price: number | null
  agreed_at: Date | string | null
  owner_note: string
  anonymized_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}

export function isoOrNull(value: Date | string | null): string | null {
  if (value === null) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

/** Date column → "YYYY-MM-DD" regardless of driver. */
export function dateOnly(value: Date | string | null): string | null {
  if (value === null) return null
  if (typeof value === 'string') return value.slice(0, 10)
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function logEvent(db: Db, orderId: string, kind: string, data: Record<string, unknown> = {}): Promise<void> {
  await db.query('INSERT INTO order_events (order_id, kind, data) VALUES ($1, $2, $3::jsonb)', [orderId, kind, JSON.stringify(data)])
}

/** Shape safe for the public status page: no phone, address, photos or owner note. */
export function publicOrderView(row: OrderRow, photoCount: number, bonus: PublicBonus | null): PublicOrder {
  return {
    token: row.public_token,
    status: row.status,
    firstName: row.anonymized_at ? '' : (row.customer_name.split(/\s+/)[0] ?? ''),
    outOfCity: row.out_of_city,
    preferredDate: dateOnly(row.preferred_date),
    preferredTime: row.preferred_time,
    items: row.items,
    estimate: row.estimate,
    minOrder: row.price_snapshot.minOrder,
    finalPrice: row.final_price,
    agreedAt: isoOrNull(row.agreed_at),
    photoCount,
    createdAt: isoOrNull(row.created_at),
    updatedAt: isoOrNull(row.updated_at),
    bonus,
  }
}

/**
 * Retention: personal data of finished orders is wiped after `retentionDays`.
 * Called lazily from admin list requests (no cron needed on serverless).
 */
export async function applyRetention(db: Db, retentionDays: number): Promise<number> {
  const rows = await db.query<{ id: string }>(
    `UPDATE orders SET customer_name = 'Видалено', customer_phone = '', address = '', comment = '', owner_note = '',
       anonymized_at = now(), updated_at = now()
     WHERE anonymized_at IS NULL AND status IN ('done', 'cancelled')
       AND updated_at < now() - make_interval(days => $1)
     RETURNING id`,
    [retentionDays],
  )
  if (rows.length) {
    await db.query('DELETE FROM uploads WHERE order_id IN (SELECT id FROM orders WHERE anonymized_at IS NOT NULL)')
  }
  await db.query(`DELETE FROM uploads WHERE order_id IS NULL AND created_at < now() - interval '1 day'`)
  return rows.length
}
