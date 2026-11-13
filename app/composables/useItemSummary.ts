import { EXTRA_IDS } from '#shared/types'
import type { ItemConfig } from '#shared/types'
import { EXTRA_LABELS, FREQUENCY_LABELS, TYPE_LABELS } from '#shared/content/services'
import { isAreaType } from '#shared/pricing'

/** Human-readable lines describing one configured service. */
export function describeItem(c: ItemConfig): { title: string; params: string[]; extras: string[] } {
  const params: string[] = []
  if (isAreaType(c.type)) {
    params.push(`${c.area} м²`, `${c.rooms} кімн.`, `${c.bathrooms} санвуз.`)
  } else if (c.type === 'windows') {
    params.push(`${c.sashes} стулок`)
    if (c.balcony) params.push('балкон/лоджія')
  } else if (c.description) {
    params.push(c.description.length > 90 ? `${c.description.slice(0, 90)}…` : c.description)
  }
  if (c.type !== 'other') {
    params.push(FREQUENCY_LABELS[c.frequency].toLowerCase())
    if (c.heavyDirt) params.push('сильне забруднення')
  }
  const extras = EXTRA_IDS.filter((id) => (c.extras[id] ?? 0) > 0).map((id) => `${EXTRA_LABELS[id].title} × ${c.extras[id]}`)
  return { title: TYPE_LABELS[c.type], params, extras }
}
