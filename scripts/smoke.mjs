// End-to-end API check against a running instance. Uses only fictional data.
// Usage: node scripts/smoke.mjs [baseUrl]   (admin password from NUXT_ADMIN_PASSWORD or .env)
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const BASE = process.argv[2] ?? 'http://localhost:3010'
const ORIGIN = new URL(BASE).origin
const env = Object.fromEntries(
  (() => {
    try {
      return readFileSync(new URL('../.env', import.meta.url), 'utf8')
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
    } catch {
      return []
    }
  })(),
)
const PASSWORD = process.env.NUXT_ADMIN_PASSWORD ?? env.NUXT_ADMIN_PASSWORD

let failures = 0
const ok = (cond, label, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  — ${extra}` : ''}`)
  if (!cond) failures++
}

async function call(path, { method = 'GET', body, headers = {}, cookie, origin = ORIGIN, raw = false } = {}) {
  const h = { ...headers }
  if (origin) h.origin = origin
  if (cookie) h.cookie = cookie
  let payload = body
  if (body && !(body instanceof FormData)) {
    h['content-type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(BASE + path, { method, headers: h, body: payload })
  const data = raw ? Buffer.from(await res.arrayBuffer()) : await res.text().then((t) => { try { return JSON.parse(t) } catch { return t } })
  return { res, data }
}

const key = () => `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

// --- public settings
const s = await call('/api/settings')
ok(s.res.ok && s.data.prices?.perM2?.general > 0, 'GET /api/settings returns prices')

// --- photo with EXIF GPS → must be stripped
const jpeg = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: '#88aa99' } })
  .jpeg()
  .withExif({ IFD0: { Make: 'SmokeCam', Model: 'X' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '50/1 27/1 0/1' } })
  .toBuffer()
const before = await sharp(jpeg).metadata()
ok(Boolean(before.exif), 'test JPEG carries EXIF before upload')
const fd = new FormData()
fd.append('file', new Blob([jpeg], { type: 'image/jpeg' }), 'room.jpg')
const up = await call('/api/uploads', { method: 'POST', body: fd })
ok(up.res.ok && typeof up.data.token === 'string', 'upload accepted', JSON.stringify(up.data).slice(0, 80))
ok(up.data.width <= 1600 && up.data.height <= 1600, 'upload resized to ≤1600px', `${up.data.width}×${up.data.height}`)

const fake = new FormData()
fake.append('file', new Blob([Buffer.from('<?php echo 1; ?>')], { type: 'image/jpeg' }), 'x.jpg')
const bad = await call('/api/uploads', { method: 'POST', body: fake })
ok(bad.res.status === 415, 'non-image with image/jpeg type rejected (415)', String(bad.res.status))

// --- order
const order = {
  idempotencyKey: key(),
  items: [
    { id: 'a', qty: 1, config: { type: 'general', area: 60, rooms: 2, bathrooms: 2, sashes: 0, balcony: false, extras: { oven: 1 }, frequency: 'once', heavyDirt: true, description: '' } },
    { id: 'b', qty: 1, config: { type: 'windows', area: 0, rooms: 0, bathrooms: 0, sashes: 6, balcony: true, extras: {}, frequency: 'once', heavyDirt: false, description: '' } },
    { id: 'c', qty: 1, config: { type: 'other', area: 0, rooms: 0, bathrooms: 0, sashes: 0, balcony: false, extras: {}, frequency: 'once', heavyDirt: false, description: 'Тераса після зими, вигадана тестова задача' } },
  ],
  customer: { name: 'Тест Тестенко', phone: '+380000000000', address: 'вул. Вигадана, 1, кв. 1', outOfCity: true },
  preferredDate: '',
  preferredTime: '',
  comment: 'Smoke test, кіт вдома',
  photoTokens: [up.data.token],
  consent: true,
  // A tampered client total must be ignored by the server.
  total: 1,
}

const noOrigin = await call('/api/orders', { method: 'POST', body: order, origin: null })
ok(noOrigin.res.status === 403, 'POST without Origin rejected (403)', String(noOrigin.res.status))
const evil = await call('/api/orders', { method: 'POST', body: order, origin: 'https://evil.example' })
ok(evil.res.status === 403, 'POST from foreign Origin rejected (403)', String(evil.res.status))

const timeNoDate = await call('/api/orders', { method: 'POST', body: { ...order, idempotencyKey: key(), preferredTime: '10:00' } })
ok(timeNoDate.res.status === 422 && timeNoDate.data.data?.fields?.preferredDate, 'time without date → field error')

const noPhoto = await call('/api/orders', { method: 'POST', body: { ...order, idempotencyKey: key(), photoTokens: [] } })
ok(noPhoto.res.status === 422 && noPhoto.data.data?.fields?.photoTokens, '"Інше" without photo → field error')

const created = await call('/api/orders', { method: 'POST', body: order })
ok(created.res.status === 201 && created.data.token?.length >= 30, 'order created (201)', String(created.res.status))
const again = await call('/api/orders', { method: 'POST', body: order })
ok(again.res.ok && again.data.token === created.data.token && again.data.duplicate === true, 'retry with same key → same order, no duplicate')

const token = created.data.token
const pub = await call(`/api/orders/${token}`)
const pubText = JSON.stringify(pub.data)
ok(pub.res.ok && pub.data.status === 'new', 'public order view works')
ok(!pubText.includes('+380000000000') && !pubText.includes('Вигадана') && !pubText.includes('owner'), 'public view hides phone, address, note')
// 60×62=3720 +200 bath +350 oven = 4270; +25% = 5337.5 → 5340; windows 6×120+250 = 970; sum 6310; travel 300
ok(pub.data.estimate.knownSum === 6310 && pub.data.estimate.travelFee === 300 && pub.data.estimate.total === 6610, 'server recalculated estimate', `known=${pub.data.estimate.knownSum} total=${pub.data.estimate.total}`)
ok(pub.data.estimate.manualCount === 1, 'manual item counted separately')

const guess = await call('/api/orders/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
ok(guess.res.status === 404, 'guessed token → 404')

// --- admin guard
const anon = await call('/api/admin/orders')
ok(anon.res.status === 401, 'admin API without session → 401')
const anonPhoto = await call('/api/admin/photos/00000000-0000-0000-0000-000000000000')
ok(anonPhoto.res.status === 401, 'photo without session → 401')

const wrong = await call('/api/admin/login', { method: 'POST', body: { password: 'wrong-password' } })
ok(wrong.res.status === 401, 'wrong password rejected')
const login = await call('/api/admin/login', { method: 'POST', body: { password: PASSWORD } })
const cookie = (login.res.headers.get('set-cookie') ?? '').split(';')[0]
ok(login.res.ok && cookie.startsWith('pr_admin='), 'owner login sets httpOnly cookie')
ok(/HttpOnly/i.test(login.res.headers.get('set-cookie') ?? ''), 'session cookie is HttpOnly')

const list = await call('/api/admin/orders?q=Тестенко', { cookie })
const mine = list.data.orders?.find((o) => o.id)
ok(list.res.ok && mine, 'admin list + search finds the order')
const detail = await call(`/api/admin/orders/${mine.id}`, { cookie })
ok(detail.data.phone === '+380000000000' && detail.data.photos.length === 1, 'admin sees contact and photo')

const photo = await call(`/api/admin/photos/${detail.data.photos[0].id}`, { cookie, raw: true })
const meta = await sharp(photo.data).metadata()
ok(photo.res.headers.get('content-type') === 'image/webp', 'photo served as webp')
ok(!meta.exif, 'stored photo has no EXIF/GPS')
ok((photo.res.headers.get('cache-control') ?? '').includes('no-store'), 'photo is not cacheable')

const agreeBad = await call(`/api/admin/orders/${mine.id}`, { method: 'PATCH', cookie, body: { status: 'agreed' } })
ok(agreeBad.res.status === 422, '"agreed" without price/time rejected')
const when = new Date(Date.now() + 3 * 24 * 3600 * 1000)
when.setMinutes(0, 0, 0)
const agree = await call(`/api/admin/orders/${mine.id}`, { method: 'PATCH', cookie, body: { status: 'agreed', finalPrice: 6500, agreedAt: when.toISOString(), ownerNote: 'приватна нотатка' } })
ok(agree.res.ok && agree.data.status === 'agreed', 'owner agreed price and time')
ok(agree.data.events.some((e) => e.kind === 'status'), 'history recorded')

const pub2 = await call(`/api/orders/${token}`)
ok(pub2.data.status === 'agreed' && pub2.data.finalPrice === 6500 && pub2.data.agreedAt, 'client sees the update by the same link')
ok(!JSON.stringify(pub2.data).includes('приватна нотатка'), 'owner note stays private')

// --- price snapshot: change prices, old order keeps its estimate
const prices = structuredClone(s.data.prices)
prices.perM2.general = 999
const put = await call('/api/admin/settings/prices', { method: 'PUT', cookie, body: prices })
ok(put.res.ok, 'prices updated')
const pub3 = await call(`/api/orders/${token}`)
ok(pub3.data.estimate.knownSum === 6310, 'old order keeps price snapshot after tariff change')
await call('/api/admin/settings/prices', { method: 'PUT', cookie, body: s.data.prices })

// --- game bonus: one code per order, current order price untouched
const game = structuredClone(s.data.game)
const playOnly = await call('/api/admin/settings/game', { method: 'PUT', cookie, body: { ...game, mode: 'play' } })
ok(playOnly.res.ok, 'game mode → play')
const noBonus = await call(`/api/orders/${token}/bonus`, { method: 'POST' })
ok(noBonus.res.ok && noBonus.data.bonus === null, '"play" mode issues no bonus')
await call('/api/admin/settings/game', { method: 'PUT', cookie, body: { ...game, mode: 'bonus', bonusAmount: 150, validDays: 30, minNextOrder: 1500 } })
const b1 = await call(`/api/orders/${token}/bonus`, { method: 'POST' })
const b2 = await call(`/api/orders/${token}/bonus`, { method: 'POST' })
ok(Boolean(b1.data.bonus?.code) && b1.data.bonus.code === b2.data.bonus?.code, 'bonus mode: exactly one code per order', b1.data.bonus?.code)
ok(b1.data.bonus?.amount === 150 && b1.data.bonus?.minOrder === 1500, 'bonus amount and minimum from settings')
const pubB = await call(`/api/orders/${token}`)
ok(pubB.data.finalPrice === 6500 && pubB.data.estimate.total === 6610, 'bonus does not change the current order')
const redeem = await call(`/api/admin/bonuses/${b1.data.bonus.code}`, { method: 'PATCH', cookie, body: { status: 'redeemed' } })
ok(redeem.res.ok, 'owner marks bonus as redeemed manually')
await call('/api/admin/settings/game', { method: 'PUT', cookie, body: game })

// --- sitemap / robots
const sm = await call('/sitemap.xml')
ok(sm.res.ok && String(sm.data).includes('<urlset'), 'sitemap.xml')
const rb = await call('/robots.txt')
ok(rb.res.ok && String(rb.data).includes('Disallow: /admin'), 'robots.txt')

// --- password change closes sessions
const tmpPass = `${PASSWORD}-tmp`
const ch = await call('/api/admin/password', { method: 'POST', cookie, body: { current: PASSWORD, next: tmpPass } })
const cookie2 = (ch.res.headers.get('set-cookie') ?? '').split(';')[0]
ok(ch.res.ok, 'password changed')
const oldSession = await call('/api/admin/orders', { cookie })
ok(oldSession.res.status === 401, 'previous session closed after password change')
const back = await call('/api/admin/password', { method: 'POST', cookie: cookie2, body: { current: tmpPass, next: PASSWORD } })
ok(back.res.ok, 'password restored')
const cookie3 = (back.res.headers.get('set-cookie') ?? '').split(';')[0]

// --- cleanup: delete the test order with its photo
const del = await call(`/api/admin/orders/${mine.id}`, { method: 'DELETE', cookie: cookie3 })
ok(del.res.ok, 'test order deleted with photos')
const gone = await call(`/api/orders/${token}`)
ok(gone.res.status === 404, 'deleted order no longer reachable')

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
