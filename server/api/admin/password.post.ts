import { passwordChangeSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  await rateLimit(event, 'password', 10, 900)
  const parsed = passwordChangeSchema.safeParse(await readBody<unknown>(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: parsed.error.issues[0]?.message ?? 'Перевірте поля' })
  }
  const hash = await adminPasswordHash()
  if (!hash || !(await verifyPassword(parsed.data.current, hash))) {
    throw createError({ statusCode: 401, message: 'Поточний пароль невірний' })
  }
  const db = await useDb()
  await db.query('UPDATE admin_account SET password_hash = $1, updated_at = now() WHERE id = 1', [await hashPassword(parsed.data.next)])
  // Close every session (other devices included), then sign this one back in.
  await destroyAllSessions()
  await createSession(event)
  return { ok: true }
})
