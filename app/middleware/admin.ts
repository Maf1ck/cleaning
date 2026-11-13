export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  const { check } = useAdminAuth()
  const ok = await check()
  if (!ok) return navigateTo('/admin')
})
