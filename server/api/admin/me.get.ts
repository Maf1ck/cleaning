export default defineEventHandler(async (event) => {
  const configured = (await adminPasswordHash()) !== null
  return { authenticated: configured && (await isAdmin(event)), configured }
})
