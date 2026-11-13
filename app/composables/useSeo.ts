import { SERVICES } from '#shared/content/services'
import { rateLabel } from '#shared/pricing'

export function usePageSeo(options: { title: string; description: string; path: string; noindex?: boolean }) {
  const settings = useSettings()
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()
  const origin = (config.public.siteUrl || requestUrl.origin).replace(/\/$/, '')
  const url = `${origin}${options.path}`

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: () => `${options.title} · ${settings.value.company.name}`,
    ogDescription: options.description,
    ogType: 'website',
    ogUrl: url,
    ogLocale: 'uk_UA',
    ogImage: `${origin}/og.png`,
    twitterCard: 'summary_large_image',
    robots: options.noindex ? 'noindex, nofollow' : 'index, follow',
  })
  useHead({ link: [{ rel: 'canonical', href: url }] })
}

/** schema.org LocalBusiness built only from real settings (no invented phone or address). */
export function useLocalBusinessSchema() {
  const settings = useSettings()
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()
  const origin = (config.public.siteUrl || requestUrl.origin).replace(/\/$/, '')

  useHead({
    script: [
      {
        key: 'ld-business',
        type: 'application/ld+json',
        innerHTML: computed(() => {
          const { company, prices } = settings.value
          const data: Record<string, unknown> = {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': `${origin}/#business`,
            name: company.name,
            description: company.tagline,
            url: origin,
            image: `${origin}/icons/icon-512.png`,
            priceRange: '₴₴',
            currenciesAccepted: 'UAH',
            paymentAccepted: 'Cash, Card',
            areaServed: { '@type': 'City', name: company.city },
            address: { '@type': 'PostalAddress', addressLocality: company.city, addressCountry: 'UA' },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Послуги прибирання',
              itemListElement: SERVICES.filter((s) => s.type !== 'other').map((s) => ({
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name: s.title, description: s.lead },
                description: rateLabel(s.type, prices),
                priceCurrency: 'UAH',
              })),
            },
          }
          if (company.phone) data.telephone = company.phone
          if (company.email) data.email = company.email
          if (company.legalName) data.legalName = company.legalName
          return JSON.stringify(data)
        }),
      },
    ],
  })
}
