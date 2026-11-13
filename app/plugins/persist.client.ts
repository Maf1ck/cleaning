/**
 * Restores the cart and checkout draft from localStorage only after hydration has
 * finished (the layout is an async component, so `app:mounted` is too early and
 * would cause hydration mismatches).
 */
export default defineNuxtPlugin((nuxtApp) => {
  const restore = (): void => {
    useCartStore().restore()
    useDraftStore().restore()
  }
  if (nuxtApp.isHydrating) nuxtApp.hooks.hookOnce('app:suspense:resolve', restore)
  else restore()
})
