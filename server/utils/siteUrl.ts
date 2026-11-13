import type { H3Event } from 'h3'

export function siteOrigin(event: H3Event): string {
  const configured = useRuntimeConfig().public.siteUrl
  if (configured) return configured.replace(/\/$/, '')
  const proto = getRequestProtocol(event, { xForwardedProto: true })
  return `${proto}://${getRequestHost(event, { xForwardedHost: true })}`
}

export const PUBLIC_PAGES = ['/', '/calculator', '/privacy', '/credits'] as const
