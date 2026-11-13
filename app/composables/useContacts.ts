export interface ContactChannel {
  id: 'phone' | 'telegram' | 'viber' | 'email'
  label: string
  value: string
  href: string
}

export function formatPhone(e164: string): string {
  const d = e164.replace(/\D/g, '')
  if (d.length !== 12) return e164
  return `+${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`
}

/** Only real, configured channels. Empty settings → empty list (no placeholder numbers). */
export function useContacts() {
  const settings = useSettings()
  return computed<ContactChannel[]>(() => {
    const c = settings.value.company
    const list: ContactChannel[] = []
    if (c.phone) list.push({ id: 'phone', label: 'Подзвонити', value: formatPhone(c.phone), href: `tel:${c.phone}` })
    if (c.telegram) list.push({ id: 'telegram', label: 'Telegram', value: `@${c.telegram}`, href: `https://t.me/${c.telegram}` })
    if (c.viber) list.push({ id: 'viber', label: 'Viber', value: formatPhone(c.viber), href: `viber://chat?number=${encodeURIComponent(c.viber)}` })
    if (c.email) list.push({ id: 'email', label: 'Email', value: c.email, href: `mailto:${c.email}` })
    return list
  })
}
