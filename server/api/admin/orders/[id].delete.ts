/** Permanently deletes the order with its photos, history and bonus (right to erasure). */
export default defineEventHandler(async (event) => {
  const id = orderIdParam(event)
  const db = await useDb()
  const rows = await db.query<{ id: string }>('DELETE FROM orders WHERE id = $1 RETURNING id', [id])
  if (!rows[0]) throw createError({ statusCode: 404, message: 'Заявку не знайдено' })
  return { ok: true }
})
