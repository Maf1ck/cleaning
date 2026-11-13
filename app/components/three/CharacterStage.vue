<template lang="pug">
.stage(ref="root" :class="[`stage--${status}`, { 'stage--compact': compact }]")
  .stage__poster(:class="{ 'is-hidden': status === 'ready' }" aria-hidden="true")
    CharacterPoster(:id="active" :faces="characters.faces")
  ClientOnly
    component.stage__canvas(
      v-if="canvasComponent && status !== 'unsupported'"
      :is="canvasComponent"
      :key="attempt"
      ref="canvas"
      :active="active"
      :faces="characters.faces"
      :amp="amp"
      :reduced="reduced"
      :paused="paused"
      :ground-color="groundColor"
      :on-bubble="onBubble"
      @ready="status = 'ready'"
      @error="onCanvasError"
      @drag="dragging = $event"
    )
  .stage__bubble(
    v-if="showBubble"
    ref="bubbleEl"
    :style="bubbleStyle"
    :class="{ 'is-hidden': !bubble.visible || dragging }"
  )
    button.stage__bubble-btn(type="button" :aria-label="`${info.name} каже: ${line}. Наступна фраза`" @click="nextLine")
      strong {{ info.name }}
      span(aria-live="polite") {{ line }}
  .stage__status(v-if="status === 'loading'" role="status")
    span.stage__spinner(aria-hidden="true")
    | Завантажуємо 3D…
  .stage__status.stage__status--error(v-else-if="status === 'error'" role="alert")
    span Не вдалося показати 3D.
    AppButton(size="sm" variant="secondary" @click="retry") Спробувати ще
  .stage__status(v-else-if="status === 'unsupported'" role="note")
    | 3D недоступне на цьому пристрої — показуємо ілюстрацію. Замовлення працює як завжди.
  .stage__tools(v-if="status === 'ready'")
    span.stage__hint {{ hint }}
    button.stage__reset(type="button" aria-label="Скинути ракурс" title="Скинути ракурс" @click="resetView")
      svg(viewBox="0 0 24 24" aria-hidden="true")
        path(d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4")
  p.visually-hidden {{ info.name }}, {{ info.role }}. Тривимірний персонаж; його можна обертати пальцем або мишею.
</template>

<script setup lang="ts">
import type { Component, CSSProperties } from 'vue'
import type { CharacterId } from '#shared/content/services'
import { CHARACTERS } from '#shared/content/characters'
import type { BubblePoint } from './CharacterDirector.vue'

const props = withDefaults(defineProps<{ active: CharacterId; compact?: boolean }>(), { compact: false })

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported'

const settings = useSettings()
const characters = computed(() => settings.value.characters)
const { resolved } = useTheme()
const reduced = useReducedMotion()

const root = ref<HTMLElement | null>(null)
const canvas = ref<{ resetView: () => void } | null>(null)
const bubbleEl = ref<HTMLElement | null>(null)
const canvasComponent = shallowRef<Component | null>(null)
const status = ref<Status>('idle')
const attempt = ref(0)
const paused = ref(false)
const dragging = ref(false)
const bubble = ref<BubblePoint>({ x: 0, y: 0, width: 0, height: 0, visible: false })
const lineIndex = ref(0)
const groundColor = ref('#e6e2d8')

const info = computed(() => CHARACTERS[props.active])
const amp = computed(() => ({ friendly: 1, calm: 0.5, playful: 1.5 })[characters.value.personality])
const lines = computed(() => info.value.lines[characters.value.personality])
const line = computed(() => lines.value[lineIndex.value % lines.value.length] ?? '')
const showBubble = computed(() => characters.value.phrases && status.value === 'ready')
const hint = computed(() => (reduced.value ? 'Потягніть, щоб повернути' : 'Потягніть, щоб обертати'))

watch(
  () => props.active,
  () => {
    lineIndex.value = 0
  },
)

function nextLine(): void {
  lineIndex.value += 1
}

function onBubble(p: BubblePoint): void {
  bubble.value = p
}

const bubbleStyle = computed<CSSProperties>(() => {
  const b = bubble.value
  const el = bubbleEl.value
  const bw = el?.offsetWidth ?? 220
  const bh = el?.offsetHeight ?? 64
  const margin = 8
  // Narrow stage: pin the line to the top so it never covers the face or the controls.
  if (b.width < 380) return { left: `${margin}px`, top: `${margin}px`, maxWidth: `calc(100% - ${margin * 2}px - 56px)` }
  const left = Math.min(Math.max(b.x - 16, margin), b.width - bw - margin)
  const top = Math.min(Math.max(b.y - bh - 6, margin), b.height - bh - 56)
  return { left: `${left}px`, top: `${top}px` }
})

function readGround(): void {
  if (!import.meta.client) return
  const v = getComputedStyle(document.documentElement).getPropertyValue('--scene-ground').trim()
  if (v) groundColor.value = v
}

watch(resolved, () => nextTick(readGround))

async function load(): Promise<void> {
  status.value = 'loading'
  try {
    const mod = await import('./StageCanvas.vue')
    canvasComponent.value = markRaw(mod.default)
  } catch {
    status.value = 'error'
  }
}

function onCanvasError(): void {
  status.value = 'error'
  canvasComponent.value = null
}

function retry(): void {
  attempt.value += 1
  void load()
}

function resetView(): void {
  canvas.value?.resetView()
}

let observer: IntersectionObserver | null = null
let inView = true

function updatePaused(): void {
  paused.value = !inView || document.visibilityState === 'hidden'
}

onMounted(() => {
  readGround()
  if (!hasWebGL()) {
    status.value = 'unsupported'
    return
  }
  void load()
  observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry?.isIntersecting ?? true
      updatePaused()
    },
    { rootMargin: '80px' },
  )
  if (root.value) observer.observe(root.value)
  document.addEventListener('visibilitychange', updatePaused)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', updatePaused)
})
</script>

<style lang="scss" scoped>
.stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  border-radius: $r-xl;
  background:
    radial-gradient(120% 90% at 50% 100%, var(--c-accent-soft) 0%, transparent 60%),
    $c-surface;
  overflow: hidden;
  isolation: isolate;
  touch-action: pan-y;

  &--compact {
    min-height: 260px;
  }

  &__poster {
    position: absolute;
    inset: 12% 18% 6%;
    transition: opacity $dur-slow $ease-out;

    &.is-hidden {
      opacity: 0;
    }
  }

  &__canvas {
    position: absolute !important;
    inset: 0;
  }

  &__bubble {
    position: absolute;
    z-index: 2;
    max-width: min(260px, 70%);
    transition:
      opacity $dur-base $ease-out,
      transform $dur-base $ease-out;

    &.is-hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateY(6px);
    }
  }

  &__bubble-btn {
    display: grid;
    gap: 2px;
    width: 100%;
    padding: $sp-2 $sp-3;
    border: $border solid $c-line;
    border-radius: $r-md $r-md $r-md $sp-1;
    background: $c-surface;
    color: $c-ink;
    text-align: left;
    font-size: $fs-sm;
    line-height: $lh-snug;
    box-shadow: $shadow-1;

    strong {
      font-size: $fs-xs;
      color: $c-accent;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
  }

  &__status {
    position: absolute;
    left: $sp-3;
    right: $sp-3;
    bottom: $sp-3;
    z-index: 3;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: $sp-2;
    padding: $sp-2 $sp-3;
    border-radius: $r-md;
    background: color-mix(in srgb, var(--c-surface) 88%, transparent);
    color: $c-ink-2;
    font-size: $fs-sm;
    text-align: center;

    &--error {
      color: $c-ink;
    }
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border: $border-strong solid $c-accent;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__tools {
    position: absolute;
    right: $sp-3;
    bottom: $sp-3;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: $sp-2;
  }

  &__hint {
    padding: $sp-1 $sp-3;
    border-radius: $r-pill;
    background: color-mix(in srgb, var(--c-surface) 80%, transparent);
    color: $c-ink-3;
    font-size: $fs-xs;
  }

  &__reset {
    display: grid;
    place-items: center;
    width: $tap;
    height: $tap;
    border: $border solid $c-line;
    border-radius: 50%;
    background: $c-surface;
    color: $c-ink;
    box-shadow: $shadow-1;

    svg {
      width: 20px;
      height: 20px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
