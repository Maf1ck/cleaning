import { z } from 'zod'
import { ORDER_STATUSES } from '#shared/types'
import type { OrderRow } from '../../../utils/orders'

const querySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  status: z.enum([...ORDER_STATUSES, 'all']).optional().default('all'),
  period: z.enum(['all', 'today', '7d', '30d']).optional().default('all'),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
})

const PAGE_SIZE = 30

export default defineEventHandler(async (event) => {
  const query = querySchema.safeParse(getQuery(event))
  if (!query.success) throw createError({ statusCode: 400, message: 'Bad query' })
  const { q, status, period, page } = query.data
  const db = await useDb()
  const company = await getSetting('company')
  await applyRetention(db, company.retentionDays)

  const where: string[] = []
  const params: unknown[] = []
  if (status !== 'all') {
    params.push(status)
    where.push(`o.status = $${params.length}`)
  }
  if (period !== 'all') {
    const interval = period === 'today' ? '1 day' : period === '7d' ? '7 days' : '30 days'
    where.push(`o.created_at > now() - interval '${interval}'`)
  }
  if (q) {
    params.push(`%${q.replace(/[%_\\]/g, (c) => `\\${c}`).toLowerCase()}%`)
    const p = `$${params.length}`
    const digits = q.replace(/\D/g, '')
    let phoneClause = ''
    if (digits.length >= 3) {
      params.push(`%${digits}%`)
      phoneClause = ` OR o.customer_phone LIKE $${params.length}`
    }
    where.push(`(lower(o.customer_name) LIKE ${p} OR lower(o.address) LIKE ${p} OR lower(o.comment) LIKE ${p}${phoneClause})`)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  params.push(PAGE_SIZE + 1, (page - 1) * PAGE_SIZE)

  const rows = await db.query<OrderRow & { photo_count: number }>(
    `SELECT o.*, (SELECT count(*)::int FROM uploads u WHERE u.order_id = o.id) AS photo_count
     FROM orders o ${whereSql}
     ORDER BY o.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )
  const counts = await db.query<{ status: string; n: number }>('SELECT status, count(*)::int AS n FROM orders GROUP BY status')

  return {
    page,
    hasMore: rows.length > PAGE_SIZE,
    counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<string, number>,
    orders: rows.slice(0, PAGE_SIZE).map((r) => ({
      id: r.id,
      status: r.status,
      name: r.customer_name,
      phone: r.customer_phone,
      address: r.address,
      outOfCity: r.out_of_city,
      types: r.items.map((i) => i.config.type),
      estimateTotal: r.estimate.total,
      manualCount: r.estimate.manualCount,
      finalPrice: r.final_price,
      agreedAt: isoOrNull(r.agreed_at),
      preferredDate: dateOnly(r.preferred_date),
      preferredTime: r.preferred_time,
      photoCount: r.photo_count,
      createdAt: isoOrNull(r.created_at),
    })),
  }
})
