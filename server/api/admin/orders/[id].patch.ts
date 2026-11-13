import { adminOrderPatchSchema } from '#shared/schemas'
import type { OrderRow } from '../../../utils/orders'

export default defineEventHandler(async (event) => {
  const id = orderIdParam(event)
  const parsed = adminOrderPatchSchema.safeParse(await readBody<unknown>(event))
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.issues[0]?.message ?? 'Перевірте поля' })
  const patch = parsed.data
  const db = await useDb()

  await db.tx(async (t) => {
    const rows = await t.query<OrderRow>('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id])
    const current = rows[0]
    if (!current) throw createError({ statusCode: 404, message: 'Заявку не знайдено' })

    const next = {
      status: patch.status ?? current.status,
      finalPrice: patch.finalPrice !== undefined ? patch.finalPrice : current.final_price,
      agreedAt: patch.agreedAt !== undefined ? isoOrNull(patch.agreedAt) : isoOrNull(current.agreed_at),
      ownerNote: patch.ownerNote ?? current.owner_note,
    }
    if (next.status === 'agreed' && (next.finalPrice === null || !next.agreedAt)) {
      throw createError({ statusCode: 422, message: 'Для статусу «Погоджена» вкажіть підсумкову ціну й час виїзду' })
    }

    await t.query(
      `UPDATE orders SET status = $2, final_price = $3, agreed_at = $4, owner_note = $5, updated_at = now() WHERE id = $1`,
      [id, next.status, next.finalPrice, next.agreedAt, next.ownerNote],
    )
    if (next.status !== current.status) await logEvent(t, id, 'status', { from: current.status, to: next.status })
    if (next.finalPrice !== current.final_price) await logEvent(t, id, 'price', { value: next.finalPrice })
    if (next.agreedAt !== isoOrNull(current.agreed_at)) await logEvent(t, id, 'time', { value: next.agreedAt })
    if (next.ownerNote !== current.owner_note) await logEvent(t, id, 'note', {})
  })

  return await adminOrderView(id)
})
