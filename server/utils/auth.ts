import type { H3Event } from 'h3'

const COOKIE = 'pr_admin'
const SESSION_DAYS = 7

function cookieOptions(event: H3Event) {
  const proto = getRequestProtocol(event, { xForwardedProto: true })
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: proto === 'https',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  }
}

/** Returns the stored hash, creating it from NUXT_ADMIN_PASSWORD on first use. */
export async function adminPasswordHash(): Promise<string | null> {
  const db = await useDb()
  const rows = await db.query<{ password_hash: string }>('SELECT password_hash FROM admin_account WHERE id = 1')
  if (rows[0]) return rows[0].password_hash
  const initial = useRuntimeConfig().adminPassword || process.env.NUXT_ADMIN_PASSWORD || ''
  if (initial.length < 10) return null
  const hash = await hashPassword(initial)
  await db.query('INSERT INTO admin_account (id, password_hash) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [hash])
  const again = await db.query<{ password_hash: string }>('SELECT password_hash FROM admin_account WHERE id = 1')
  return again[0]?.password_hash ?? null
}

export async function createSession(event: H3Event): Promise<void> {
  const db = await useDb()
  const token = randomToken(32)
  await db.query(`INSERT INTO admin_sessions (token_hash, expires_at) VALUES ($1, now() + make_interval(days => $2))`, [sha256(token), SESSION_DAYS])
  setCookie(event, COOKIE, token, cookieOptions(event))
}

export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, COOKIE)
  if (token) {
    const db = await useDb()
    await db.query('DELETE FROM admin_sessions WHERE token_hash = $1', [sha256(token)])
  }
  deleteCookie(event, COOKIE, { path: '/' })
}

/** Closes every session (used after a password change). */
export async function destroyAllSessions(): Promise<void> {
  const db = await useDb()
  await db.query('DELETE FROM admin_sessions')
}

export async function isAdmin(event: H3Event): Promise<boolean> {
  const token = getCookie(event, COOKIE)
  if (!token) return false
  const db = await useDb()
  const rows = await db.query<{ ok: number }>('SELECT 1 AS ok FROM admin_sessions WHERE token_hash = $1 AND expires_at > now()', [sha256(token)])
  return rows.length > 0
}

export async function requireAdmin(event: H3Event): Promise<void> {
  if (!(await isAdmin(event))) throw createError({ statusCode: 401, message: 'Потрібен вхід у кабінет' })
}
