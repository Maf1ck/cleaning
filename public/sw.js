/* Service worker: caches only public static assets and the offline page.
 * Never caches /api, /admin, /order, /cart or /checkout (private or personal data). */
const VERSION = 'prybrano-v2'
const STATIC_CACHE = `${VERSION}-static`
const OFFLINE_URL = '/offline.html'
const PRECACHE = [OFFLINE_URL, '/icons/icon.svg', '/icons/icon-192.png', '/manifest.webmanifest']
const PRIVATE = [/^\/api\//, /^\/admin/, /^\/order\//, /^\/cart/, /^\/checkout/]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  const isPrivate = PRIVATE.some((re) => re.test(url.pathname))

  if (request.mode === 'navigate') {
    // Network only for pages (fresh prices and statuses); offline screen as a fallback.
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }
  if (isPrivate) return

  // Hashed build assets and icons: cache-first, they never change under the same URL.
  if (url.pathname.startsWith('/_nuxt/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
            }
            return res
          }),
      ),
    )
  }
})
