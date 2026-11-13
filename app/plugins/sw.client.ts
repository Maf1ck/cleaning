/** Registers the service worker in production builds only (no stale assets in dev). */
export default defineNuxtPlugin(() => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return
  const register = (): void => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  }
  // The plugin may run after the load event has already fired.
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
})
