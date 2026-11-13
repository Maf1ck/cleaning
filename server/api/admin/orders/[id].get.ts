export default defineEventHandler(async (event) => {
  return await adminOrderView(orderIdParam(event))
})
