import { z } from 'zod'

const schema = z.object({ status: z.enum(['issued', 'redeemed', 'void']) })

/** Bonus codes are redeemed manually by the owner after checking them. */
export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code') ?? ''
  const parsed = schema.safeParse(await readBody<unknown>(event))
  if (!parsed.success || !/^PR-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) throw createError({ statusCode: 400, message: 'Bad request' })
  const db = await useDb()
  const rows = await db.query<{ order_id: string }>('UPDATE bonus_codes SET status = $2 WHERE code = $1 RETURNING order_id', [code, parsed.data.status])
  if (!rows[0]) throw createError({ statusCode: 404, message: 'Код не знайдено' })
  await logEvent(db, rows[0].order_id, 'bonus_status', { status: parsed.data.status })
  return { ok: true }
})
