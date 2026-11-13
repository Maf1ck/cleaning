import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import type { H3Event } from 'h3'

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

/** Unguessable URL-safe token (default 24 bytes ≈ 192 bits). */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url')
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

let cachedSecret: string | null = null

/** Server-side secret for HMAC (IP hashing). Dev: generated once into .data/secret. */
export function serverSecret(): string {
  if (cachedSecret) return cachedSecret
  const configured = useRuntimeConfig().secret || process.env.NUXT_SECRET || ''
  if (configured) {
    cachedSecret = configured
    return configured
  }
  // No NUXT_SECRET: generate one once and keep it next to the embedded database.
  const dir = dataDir()
  const file = resolve(dir, 'secret')
  mkdirSync(dir, { recursive: true })
  if (!existsSync(file)) writeFileSync(file, randomToken(32))
  cachedSecret = readFileSync(file, 'utf8').trim()
  return cachedSecret
}

export function clientFingerprint(event: H3Event): string {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  return createHmac('sha256', serverSecret()).update(ip).digest('hex').slice(0, 32)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(password.normalize('NFKC'), salt, 64)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split('$')
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false
  const expected = Buffer.from(keyB64, 'base64')
  const actual = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/**
 * Sliding-window rate limit stored in the database, so it works across serverless
 * instances. Throws 429 when exceeded.
 */
export async function rateLimit(event: H3Event, name: string, limit: number, windowSeconds: number): Promise<void> {
  const db = await useDb()
  const bucket = `${name}:${clientFingerprint(event)}`
  const rows = await db.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM rate_hits WHERE bucket = $1 AND at > now() - make_interval(secs => $2)`,
    [bucket, windowSeconds],
  )
  if ((rows[0]?.n ?? 0) >= limit) {
    setResponseHeader(event, 'retry-after', windowSeconds)
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests', message: 'Забагато запитів. Спробуйте трохи пізніше.' })
  }
  await db.query('INSERT INTO rate_hits (bucket) VALUES ($1)', [bucket])
  if (Math.random() < 0.02) await db.query(`DELETE FROM rate_hits WHERE at < now() - interval '1 day'`)
}

/** Mutating requests must come from this site (CSRF protection on top of SameSite cookies). */
export function assertSameOrigin(event: H3Event): void {
  const origin = getRequestHeader(event, 'origin')
  const host = getRequestHost(event, { xForwardedHost: true })
  const allowed = new Set<string>()
  const site = useRuntimeConfig().public.siteUrl
  if (site) allowed.add(new URL(site).host)
  allowed.add(host)
  if (!origin) throw createError({ statusCode: 403, message: 'Missing Origin header' })
  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    throw createError({ statusCode: 403, message: 'Bad Origin header' })
  }
  if (!allowed.has(originHost)) throw createError({ statusCode: 403, message: 'Cross-origin request rejected' })
}
