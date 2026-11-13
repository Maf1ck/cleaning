const TZ_OPTS: Intl.DateTimeFormatOptions = { timeZone: 'Europe/Kyiv' }

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('uk-UA', { ...TZ_OPTS, day: 'numeric', month: 'long', weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', weekday: 'short' }).format(new Date(y, m - 1, d))
}

export function formatShort(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('uk-UA', { ...TZ_OPTS, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}
