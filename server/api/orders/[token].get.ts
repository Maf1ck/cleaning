export default defineEventHandler(async (event) => {
  await rateLimit(event, 'order-view', 120, 600)
  const { view } = await loadPublicOrder(event)
  return view
})
