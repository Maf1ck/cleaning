/** Lets the visitor remove a photo that is not attached to an order yet. */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') ?? ''
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) throw createError({ statusCode: 400, message: 'Bad token' })
  const db = await useDb()
  await db.query('DELETE FROM uploads WHERE token = $1 AND order_id IS NULL', [token])
  return { ok: true }
})
