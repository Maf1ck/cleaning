// Generates PWA icons and the Open Graph image from SVG sources. Run: pnpm icons
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const root = new URL('../public/', import.meta.url)
const icon = readFileSync(new URL('icons/icon.svg', root))

// Maskable: the mark needs a safe zone, so draw it smaller on a full-bleed square.
const maskable = Buffer.from(
  readFileSync(new URL('icons/icon.svg', root), 'utf8')
    .replace('rx="112"', 'rx="0"')
    .replace(/<path d="M256 92[^>]+>/, (m) => m.replace('<path', '<path transform="translate(51 51) scale(0.8)"'))
    .replace(/<path d="M205 312[^>]+>/, (m) => m.replace('<path', '<path transform="translate(51 51) scale(0.8)"'))
    .replace('cx="392" cy="128"', 'cx="364" cy="154"'),
)

const jobs = [
  [icon, 192, 'icons/icon-192.png'],
  [icon, 512, 'icons/icon-512.png'],
  [icon, 180, 'icons/apple-touch-icon.png'],
  [maskable, 512, 'icons/maskable-512.png'],
]
for (const [src, size, out] of jobs) {
  await sharp(src).resize(size, size).png().toFile(new URL(out, root).pathname.replace(/^\/([A-Z]:)/, '$1'))
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f5f3ee"/>
  <circle cx="980" cy="330" r="220" fill="#dcebe3"/>
  <g transform="translate(860 190) scale(0.55)">
    <rect width="512" height="512" rx="112" fill="#1e6b52"/>
    <path d="M256 92c62 73 122 139 122 208a122 122 0 0 1-244 0c0-69 60-135 122-208Z" fill="#f5f3ee"/>
    <path d="M205 312c6 31 27 52 58 56" stroke="#1e6b52" stroke-width="22" stroke-linecap="round" fill="none"/>
    <circle cx="392" cy="128" r="30" fill="#f2b33d"/>
  </g>
  <text x="80" y="250" font-family="Arial, sans-serif" font-size="84" font-weight="700" fill="#17231f">Прибрано</text>
  <text x="80" y="330" font-family="Arial, sans-serif" font-size="40" fill="#46524d">Прибирання з виїздом.</text>
  <text x="80" y="385" font-family="Arial, sans-serif" font-size="40" fill="#46524d">Ціна одразу, без передоплати.</text>
</svg>`
await sharp(Buffer.from(og)).png().toFile(new URL('og.png', root).pathname.replace(/^\/([A-Z]:)/, '$1'))
console.log('Icons generated')
