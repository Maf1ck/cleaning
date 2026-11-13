import { z } from 'zod'

const querySchema = z.object({ q: z.string().trim().toUpperCase().max(20).optional().default('') })

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))
  const q = parsed.success ? parsed.data.q : ''
  const db = await useDb()
  const rows = await db.query<{ code: string; amount: number; min_order: number; expires_at: Date | string; status: string; created_at: Date | string; order_id: string; customer_name: string }>(
    `SELECT b.code, b.amount, b.min_order, b.expires_at, b.status, b.created_at, b.order_id, o.customer_name
     FROM bonus_codes b JOIN orders o ON o.id = b.order_id
     WHERE ($1 = '' OR b.code LIKE '%' || $1 || '%')
     ORDER BY b.created_at DESC LIMIT 100`,
    [q],
  )
  return rows.map((r) => ({
    code: r.code,
    amount: r.amount,
    minOrder: r.min_order,
    expiresAt: isoOrNull(r.expires_at),
    status: r.status,
    createdAt: isoOrNull(r.created_at),
    orderId: r.order_id,
    name: r.customer_name,
  }))
})
