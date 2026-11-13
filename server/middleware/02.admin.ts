const OPEN = new Set(['/api/admin/login', '/api/admin/me'])

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/admin/')) return
  if (OPEN.has(path)) return
  await requireAdmin(event)
})
