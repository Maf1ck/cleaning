/** Interior photos are private: served only to a signed-in owner, never cached. */
export default defineEventHandler(async (event) => {
  const id = orderIdParam(event)
  const db = await useDb()
  const rows = await db.query<{ mime: string; bytes: Uint8Array }>('SELECT mime, bytes FROM uploads WHERE id = $1 AND order_id IS NOT NULL', [id])
  const photo = rows[0]
  if (!photo) throw createError({ statusCode: 404, message: 'Фото не знайдено' })
  setResponseHeaders(event, {
    'content-type': photo.mime,
    'cache-control': 'private, no-store',
    'content-disposition': 'inline',
    'x-content-type-options': 'nosniff',
  })
  return Buffer.from(photo.bytes)
})
