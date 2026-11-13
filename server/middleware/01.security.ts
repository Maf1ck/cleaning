const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export default defineEventHandler((event) => {
  const path = event.path
  if (!path.startsWith('/api/')) return
  setResponseHeader(event, 'cache-control', 'no-store')
  setResponseHeader(event, 'x-robots-tag', 'noindex')
  if (MUTATING.has(event.method)) assertSameOrigin(event)
})
