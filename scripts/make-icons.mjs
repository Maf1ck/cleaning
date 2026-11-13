// Generates favicons, PWA icons and the Open Graph image from the logo mark. Run: pnpm icons
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const pub = (p) => fileURLToPath(new URL(`../public/${p}`, import.meta.url))
const icon = readFileSync(pub('icons/icon.svg'))

const MARK = `
  <path d="M256 92c62 73 122 139 122 208a122 122 0 0 1-244 0c0-69 60-135 122-208Z" fill="#ffffff"/>
  <path d="M205 312c6 31 27 52 58 56" stroke="#1e6b52" stroke-width="24" stroke-linecap="round" fill="none"/>
  <path d="M392 84l12 32 32 12-32 12-12 32-12-32-32-12 32-12Z" fill="#f2b33d"/>`

// Maskable: full-bleed square, mark scaled into the 80% safe zone.
const maskable = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1e6b52"/>
  <g transform="translate(51 51) scale(0.8)">${MARK}</g></svg>`)

const png = (src, size) => sharp(src, { density: 384 }).resize(size, size).png().toBuffer()

const outputs = [
  [icon, 16, 'icons/favicon-16.png'],
  [icon, 32, 'icons/favicon-32.png'],
  [icon, 180, 'icons/apple-touch-icon.png'],
  [icon, 192, 'icons/icon-192.png'],
  [icon, 512, 'icons/icon-512.png'],
  [maskable, 512, 'icons/maskable-512.png'],
]
for (const [src, size, out] of outputs) writeFileSync(pub(out), await png(src, size))

// favicon.ico with PNG payloads (16, 32, 48) — supported by all current browsers.
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map((s) => png(icon, s)))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)
let offset = 6 + 16 * images.length
const entries = images.map((img, i) => {
  const e = Buffer.alloc(16)
  e.writeUInt8(sizes[i] % 256, 0)
  e.writeUInt8(sizes[i] % 256, 1)
  e.writeUInt8(0, 2)
  e.writeUInt8(0, 3)
  e.writeUInt16LE(1, 4)
  e.writeUInt16LE(32, 6)
  e.writeUInt32LE(img.length, 8)
  e.writeUInt32LE(offset, 12)
  offset += img.length
  return e
})
writeFileSync(pub('favicon.ico'), Buffer.concat([header, ...entries, ...images]))

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f5f3ee"/>
  <circle cx="980" cy="330" r="220" fill="#dcebe3"/>
  <g transform="translate(840 190) scale(0.55)"><rect width="512" height="512" rx="128" fill="#1e6b52"/>${MARK}</g>
  <text x="80" y="250" font-family="Arial, sans-serif" font-size="84" font-weight="700" fill="#17231f">Прибрано</text>
  <text x="80" y="330" font-family="Arial, sans-serif" font-size="40" fill="#46524d">Прибирання з виїздом.</text>
  <text x="80" y="385" font-family="Arial, sans-serif" font-size="40" fill="#46524d">Ціна одразу, без передоплати.</text>
</svg>`
writeFileSync(pub('og.png'), await sharp(Buffer.from(og)).png().toBuffer())
console.log('Icons generated')
