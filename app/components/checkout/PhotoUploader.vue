<template lang="pug">
.photos
  .photos__head
    span.photos__label#photos-label
      | Фото приміщення
      span.photos__req(v-if="required")  — обовʼязково для «Інше»
      span.photos__opt(v-else)  — за бажанням
    span.photos__count {{ total }} / {{ LIMITS.photos.max }}
  p.photos__hint JPEG, PNG або WebP до {{ maxMb }} МБ. Фото бачить лише власник; геодані й EXIF видаляємо.
  ul.photos__grid(aria-labelledby="photos-label")
    li.photo(v-for="p in modelValue" :key="p.token")
      img.photo__img(:src="p.thumb" :alt="`Фото: ${p.name}`")
      button.photo__remove(type="button" :aria-label="`Видалити фото ${p.name}`" @click="removeDone(p)") ×
    li.photo.photo--pending(v-for="p in pending" :key="p.id" :class="{ 'is-error': p.status === 'error' }")
      img.photo__img(v-if="p.thumb" :src="p.thumb" alt="")
      .photo__overlay
        template(v-if="p.status === 'uploading'")
          span.photo__spinner(aria-hidden="true")
          span.visually-hidden Завантаження {{ p.name }}
        template(v-else)
          span.photo__error {{ p.error }}
          button.photo__retry(type="button" @click="upload(p)") Повторити
          button.photo__dismiss(type="button" :aria-label="`Прибрати ${p.name}`" @click="dropPending(p.id)") ×
    li(v-if="total < LIMITS.photos.max")
      label.photos__add
        input.photos__input(
          ref="input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          :aria-invalid="Boolean(error)"
          :aria-describedby="error ? 'photos-error' : undefined"
          @change="onPick"
        )
        span.photos__plus(aria-hidden="true") +
        span Додати фото
  p#photos-error.photos__error(v-if="error" role="alert") {{ error }}
</template>

<script setup lang="ts">
import { LIMITS } from '#shared/limits'
import type { DraftPhoto } from '~/stores/draft'

interface Pending {
  id: number
  file: File
  name: string
  thumb: string
  status: 'uploading' | 'error'
  error: string
}

const props = withDefaults(defineProps<{ modelValue: DraftPhoto[]; required?: boolean; error?: string }>(), { required: false, error: '' })
const emit = defineEmits<{ 'update:modelValue': [value: DraftPhoto[]]; busy: [value: boolean] }>()

const input = ref<HTMLInputElement | null>(null)
const pending = ref<Pending[]>([])
const total = computed(() => props.modelValue.length + pending.value.length)
const maxMb = Math.round(LIMITS.photos.maxBytes / 1024 / 1024)
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
let seq = 0

watch(
  () => pending.value.some((p) => p.status === 'uploading'),
  (busy) => emit('busy', busy),
)

async function makeThumb(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file)
    const size = 200
    const scale = Math.max(size / bitmap.width, size / bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    const w = bitmap.width * scale
    const h = bitmap.height * scale
    ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
    bitmap.close()
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return ''
  }
}

function serverMessage(e: unknown): string {
  const err = e as { data?: { message?: string }; statusCode?: number }
  if (err?.data?.message) return err.data.message
  return 'Не вдалося завантажити. Перевірте звʼязок.'
}

/**
 * Downscales big phone photos before upload (keeps requests under serverless body
 * limits and saves mobile data). The server still validates and re-encodes.
 */
async function shrink(file: File): Promise<Blob> {
  const MAX_SIDE = 2048
  if (file.size < 1.5 * 1024 * 1024) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

async function upload(p: Pending): Promise<void> {
  p.status = 'uploading'
  p.error = ''
  const body = new FormData()
  body.append('file', await shrink(p.file), p.name)
  try {
    const res = await $fetch<{ token: string }>('/api/uploads', { method: 'POST', body })
    pending.value = pending.value.filter((x) => x.id !== p.id)
    emit('update:modelValue', [...props.modelValue, { token: res.token, thumb: p.thumb, name: p.name }])
  } catch (e) {
    const target = pending.value.find((x) => x.id === p.id)
    if (target) {
      target.status = 'error'
      target.error = serverMessage(e)
    }
  }
}

async function onPick(e: Event): Promise<void> {
  const el = e.target as HTMLInputElement
  const files = Array.from(el.files ?? [])
  el.value = ''
  for (const file of files) {
    if (total.value >= LIMITS.photos.max) break
    const p: Pending = { id: ++seq, file, name: file.name, thumb: '', status: 'uploading', error: '' }
    if (!ALLOWED.includes(file.type)) {
      p.status = 'error'
      p.error = 'Лише JPEG, PNG або WebP'
    } else if (file.size > LIMITS.photos.maxBytes) {
      p.status = 'error'
      p.error = `Більше ${maxMb} МБ`
    }
    pending.value.push(p)
    const live = pending.value.find((x) => x.id === p.id)
    if (!live) continue
    live.thumb = await makeThumb(file)
    if (live.status === 'uploading') void upload(live)
  }
}

function dropPending(id: number): void {
  pending.value = pending.value.filter((p) => p.id !== id)
}

function removeDone(photo: DraftPhoto): void {
  emit(
    'update:modelValue',
    props.modelValue.filter((p) => p.token !== photo.token),
  )
  // Best effort: the server also deletes unattached uploads after 24 h.
  $fetch(`/api/uploads/${photo.token}`, { method: 'DELETE' }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.photos {
  display: grid;
  gap: $sp-2;

  &__head {
    display: flex;
    justify-content: space-between;
    gap: $sp-3;
  }

  &__label {
    font-weight: $fw-semibold;
  }

  &__req {
    color: $c-danger;
    font-weight: $fw-medium;
  }

  &__opt {
    color: $c-ink-3;
    font-weight: $fw-regular;
  }

  &__count {
    color: $c-ink-3;
    font-size: $fs-sm;
  }

  &__hint {
    font-size: $fs-sm;
    color: $c-ink-3;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: $sp-2;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__add {
    display: grid;
    place-items: center;
    align-content: center;
    gap: $sp-1;
    aspect-ratio: 1;
    border: $border-strong dashed $c-line;
    border-radius: $r-md;
    background: $c-bg;
    color: $c-ink-2;
    font-size: $fs-sm;
    text-align: center;
    cursor: pointer;

    &:hover {
      border-color: $c-accent;
      color: $c-ink;
    }

    &:has(:focus-visible) {
      @include focus-ring;
    }
  }

  &__input {
    @include visually-hidden;
  }

  &__plus {
    font-size: $fs-2xl;
    line-height: 1;
  }

  &__error {
    color: $c-danger;
    font-size: $fs-sm;
  }
}

.photo {
  position: relative;
  aspect-ratio: 1;
  border-radius: $r-md;
  overflow: hidden;
  background: $c-surface-2;

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__remove,
  &__dismiss {
    position: absolute;
    top: $sp-1;
    right: $sp-1;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 50%;
    background: $c-overlay;
    color: $c-on-overlay;
    font-size: $fs-xl;
    line-height: 1;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    align-content: center;
    gap: $sp-1;
    padding: $sp-2;
    background: color-mix(in srgb, var(--c-surface) 70%, transparent);
    text-align: center;
  }

  &__spinner {
    width: 24px;
    height: 24px;
    border: $border-strong solid $c-accent;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__error {
    font-size: $fs-xs;
    color: $c-danger;
    font-weight: $fw-semibold;
  }

  &__retry {
    min-height: 32px;
    padding: 0 $sp-2;
    border: 0;
    border-radius: $r-pill;
    background: $c-accent;
    color: $c-accent-ink;
    font-size: $fs-xs;
    font-weight: $fw-bold;
  }

  &.is-error {
    outline: $border-strong solid $c-danger;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
