export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key') ?? ''
  if (!isSettingsKey(key)) throw createError({ statusCode: 404, message: 'Unknown settings section' })
  const parsed = SETTINGS[key].schema.safeParse(await readBody<unknown>(event))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw createError({ statusCode: 422, message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Перевірте поля' })
  }
  await setSetting(key, parsed.data as never)
  return await getSetting(key)
})
