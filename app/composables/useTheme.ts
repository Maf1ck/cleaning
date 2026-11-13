export type ThemeChoice = 'system' | 'light' | 'dark'

const ORDER: ThemeChoice[] = ['system', 'light', 'dark']

export const THEME_LABELS: Record<ThemeChoice, string> = {
  system: 'Тема як у системі',
  light: 'Світла тема',
  dark: 'Темна тема',
}

export function useTheme() {
  const theme = useCookie<ThemeChoice>('pr-theme', {
    default: () => 'system',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  /** Theme actually rendered (resolves "system" on the client). */
  const resolved = useState<'light' | 'dark'>('theme-resolved', () => 'light')

  function sync(): void {
    if (!import.meta.client) return
    const dark = theme.value === 'dark' || (theme.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    resolved.value = dark ? 'dark' : 'light'
  }

  function cycle(): void {
    const i = ORDER.indexOf(theme.value)
    theme.value = ORDER[(i + 1) % ORDER.length] ?? 'system'
    sync()
  }

  return { theme, resolved, cycle, sync }
}
