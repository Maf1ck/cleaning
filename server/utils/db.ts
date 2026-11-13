import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import type { Sql } from 'postgres'
import { MIGRATIONS } from '../db/migrations'

/**
 * Minimal database interface shared by both drivers:
 * - production: real PostgreSQL via DATABASE_URL (postgres.js)
 * - local dev / demo without a server: PGlite (PostgreSQL compiled to WASM) stored in .data/
 * Both speak the same SQL with $1-style parameters.
 */
export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>
  driver: 'postgres' | 'pglite'
}

type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }> }

function wrapPglite(client: PGlite | Queryable, root: PGlite): Db {
  return {
    driver: 'pglite',
    async query<T>(text: string, params: unknown[] = []) {
      const res = await client.query(text, params)
      return res.rows as T[]
    },
    tx(fn) {
      return root.transaction((t) => fn(wrapPglite(t as unknown as Queryable, root)))
    },
  }
}

function wrapPostgres(sql: Sql): Db {
  return {
    driver: 'postgres',
    async query<T>(text: string, params: unknown[] = []) {
      const rows = await sql.unsafe(text, params as never[])
      return rows as unknown as T[]
    },
    async tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
      const result = await sql.begin((t) => fn(wrapPostgres(t as unknown as Sql)))
      return result as T
    },
  }
}

async function migrate(db: Db): Promise<void> {
  await db.query('CREATE TABLE IF NOT EXISTS schema_version (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
  const rows = await db.query<{ v: number | null }>('SELECT max(version) AS v FROM schema_version')
  const current = rows[0]?.v ?? 0
  for (const [index, statements] of MIGRATIONS.entries()) {
    const version = index + 1
    if (version <= current) continue
    await db.tx(async (t) => {
      for (const statement of statements) await t.query(statement)
      await t.query('INSERT INTO schema_version (version) VALUES ($1)', [version])
    })
  }
}

async function connect(): Promise<Db> {
  const config = useRuntimeConfig()
  const url = config.databaseUrl || process.env.DATABASE_URL || ''
  let db: Db
  if (url) {
    const { default: postgres } = await import('postgres')
    const sql = postgres(url, { max: 5, idle_timeout: 20, prepare: false, onnotice: () => {} })
    db = wrapPostgres(sql)
  } else {
    const { PGlite } = await import('@electric-sql/pglite')
    const dir = resolve(dataDir(), 'pglite')
    mkdirSync(dir, { recursive: true })
    if (process.env.VERCEL) {
      console.warn('[db] DATABASE_URL is not set: using embedded PGlite in /tmp. Data is lost on every cold start.')
    }
    const client = await PGlite.create(dir)
    db = wrapPglite(client, client)
  }
  await migrate(db)
  return db
}

/**
 * Folder for the embedded database and the generated secret (like the confectioner
 * template's SQLite file): DATA_DIR, otherwise .data/ next to the app, or /tmp on
 * Vercel, where only /tmp is writable and it does not survive a cold start.
 */
export function dataDir(): string {
  if (process.env.DATA_DIR) return resolve(process.env.DATA_DIR)
  if (process.env.VERCEL) return '/tmp/prybrano'
  return resolve(process.cwd(), '.data')
}

export type StorageKind = 'postgres' | 'embedded' | 'embedded-temporary'

export function storageKind(): StorageKind {
  if (useRuntimeConfig().databaseUrl || process.env.DATABASE_URL) return 'postgres'
  return process.env.VERCEL && !process.env.DATA_DIR ? 'embedded-temporary' : 'embedded'
}

const globalKey = Symbol.for('prybrano.db')
type GlobalWithDb = typeof globalThis & { [globalKey]?: Promise<Db> }

export function useDb(): Promise<Db> {
  const g = globalThis as GlobalWithDb
  if (!g[globalKey]) {
    g[globalKey] = connect().catch((error: unknown) => {
      delete g[globalKey]
      throw error
    })
  }
  return g[globalKey]
}
