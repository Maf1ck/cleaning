import { z } from 'zod'

const schema = z.object({ password: z.string().min(1).max(200) })

export default defineEventHandler(async (event) => {
  await rateLimit(event, 'login', 10, 900)
  const parsed = schema.safeParse(await readBody<unknown>(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: 'Введіть пароль' })
  const hash = await adminPasswordHash()
  if (!hash) throw createError({ statusCode: 503, message: 'Пароль власника не налаштовано (NUXT_ADMIN_PASSWORD, мінімум 10 символів)' })
  if (!(await verifyPassword(parsed.data.password, hash))) {
    throw createError({ statusCode: 401, message: 'Невірний пароль' })
  }
  await createSession(event)
  return { ok: true }
})
