import { LIMITS } from '#shared/limits'

const ALLOWED = new Set(['jpeg', 'png', 'webp'])

export interface ProcessedImage {
  bytes: Buffer
  mime: 'image/webp'
  width: number
  height: number
}

/**
 * Validates the real format from file content (not the extension or the declared
 * MIME type), applies EXIF orientation, resizes and re-encodes to WebP. Sharp drops
 * all metadata (EXIF, GPS, XMP, ICC) unless asked to keep it, so the result has no geodata.
 */
export async function processUpload(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength === 0) throw createError({ statusCode: 400, message: 'Порожній файл' })
  if (input.byteLength > LIMITS.photos.maxBytes) {
    throw createError({ statusCode: 413, message: `Файл більший за ${Math.round(LIMITS.photos.maxBytes / 1024 / 1024)} МБ` })
  }
  const { default: sharp } = await import('sharp')
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>['metadata']>>
  try {
    meta = await sharp(input, { failOn: 'error', limitInputPixels: 60_000_000 }).metadata()
  } catch {
    throw createError({ statusCode: 415, message: 'Файл не схожий на зображення' })
  }
  if (!meta.format || !ALLOWED.has(meta.format)) {
    throw createError({ statusCode: 415, message: 'Підтримуються лише JPEG, PNG і WebP' })
  }
  const { data, info } = await sharp(input, { failOn: 'error', limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: LIMITS.photos.maxSide, height: LIMITS.photos.maxSide, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true })
  return { bytes: data, mime: 'image/webp', width: info.width, height: info.height }
}
