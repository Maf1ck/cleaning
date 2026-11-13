import { randomUUID } from 'node:crypto'

/**
 * Accepts one photo (multipart field "file"). Returns an unguessable token that the
 * order form sends later. Pending uploads cannot be fetched by anyone: the bytes are
 * only served to the owner's cabinet after the photo is attached to an order.
 */
export default defineEventHandler(async (event) => {
  await rateLimit(event, 'upload', 30, 600)
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file')
  if (!file?.data) throw createError({ statusCode: 400, message: 'Файл не передано' })

  const image = await processUpload(file.data)
  const db = await useDb()
  const token = randomToken(24)
  await db.query('INSERT INTO uploads (id, token, mime, width, height, size, bytes) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
    randomUUID(),
    token,
    image.mime,
    image.width,
    image.height,
    image.bytes.byteLength,
    image.bytes,
  ])
  return { token, width: image.width, height: image.height, size: image.bytes.byteLength }
})
