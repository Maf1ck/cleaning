import { fileURLToPath } from 'node:url'
import { templateCompilerOptions } from '@tresjs/core'

const tokensPath = fileURLToPath(new URL('./app/assets/styles/_tokens.scss', import.meta.url)).replace(/\\/g, '/')

const privateHeaders = {
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow',
}

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/styles/main.scss'],
  components: [{ path: '~/components', pathPrefix: false }],

  vue: {
    compilerOptions: templateCompilerOptions.template.compilerOptions,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'uk' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Unbounded:wght@500;600&display=swap',
        },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/icon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/favicon-16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#F5F3EE', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#101513', media: '(prefers-color-scheme: dark)' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
    },
  },

  runtimeConfig: {
    databaseUrl: '',
    adminPassword: '',
    secret: '',
    public: {
      siteUrl: '',
    },
  },

  routeRules: {
    '/admin/**': { ssr: false, headers: privateHeaders },
    '/admin': { ssr: false, headers: privateHeaders },
    '/order/**': { headers: privateHeaders },
    '/checkout': { headers: { 'x-robots-tag': 'noindex' } },
    '/cart': { headers: { 'x-robots-tag': 'noindex' } },
    '/api/**': { headers: { 'cache-control': 'no-store' } },
    '/**': {
      headers: {
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'x-frame-options': 'DENY',
        'permissions-policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "${tokensPath}" as *;\n`,
        },
      },
    },
    optimizeDeps: {
      include: ['three', '@tresjs/core', '@tresjs/cientos'],
    },
  },

  nitro: {
    externals: {
      external: ['@electric-sql/pglite', 'sharp', 'postgres'],
    },
  },

  typescript: {
    strict: true,
    tsConfig: {
      vueCompilerOptions: {
        plugins: ['@vue/language-plugin-pug'],
      },
    },
  },
})
