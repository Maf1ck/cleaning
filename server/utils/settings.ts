import type { z } from 'zod'
import { DEFAULT_CHARACTERS, DEFAULT_COMPANY, DEFAULT_GAME, DEFAULT_PRICES } from '#shared/defaults'
import { charactersSchema, companySchema, gameSchema, priceListSchema } from '#shared/schemas'
import type { PublicSettings } from '#shared/types'

export const SETTINGS = {
  company: { schema: companySchema, defaults: DEFAULT_COMPANY },
  prices: { schema: priceListSchema, defaults: DEFAULT_PRICES },
  game: { schema: gameSchema, defaults: DEFAULT_GAME },
  characters: { schema: charactersSchema, defaults: DEFAULT_CHARACTERS },
} as const

export type SettingsKey = keyof typeof SETTINGS
type SettingsValue<K extends SettingsKey> = z.infer<(typeof SETTINGS)[K]['schema']>

export function isSettingsKey(key: string): key is SettingsKey {
  return key in SETTINGS
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (typeof base !== 'object' || base === null || typeof patch !== 'object' || patch === null || Array.isArray(base)) {
    return (patch === undefined ? base : patch) as T
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    out[k] = k in out ? deepMerge(out[k], v) : v
  }
  return out as T
}

export async function getSetting<K extends SettingsKey>(key: K): Promise<SettingsValue<K>> {
  const db = await useDb()
  const rows = await db.query<{ value: unknown }>('SELECT value FROM settings WHERE key = $1', [key])
  const def = SETTINGS[key]
  // Merge with defaults so a new field added in code does not break old instances.
  const merged = deepMerge(structuredClone(def.defaults), rows[0]?.value ?? {})
  const parsed = def.schema.safeParse(merged)
  return (parsed.success ? parsed.data : structuredClone(def.defaults)) as SettingsValue<K>
}

export async function setSetting<K extends SettingsKey>(key: K, value: SettingsValue<K>): Promise<void> {
  const db = await useDb()
  await db.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  )
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const [company, prices, game, characters] = await Promise.all([getSetting('company'), getSetting('prices'), getSetting('game'), getSetting('characters')])
  return { company, prices, game, characters }
}
