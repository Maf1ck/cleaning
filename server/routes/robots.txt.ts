export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /order/', 'Disallow: /cart', 'Disallow: /checkout', '', `Sitemap: ${siteOrigin(event)}/sitemap.xml`, ''].join('\n')
})
