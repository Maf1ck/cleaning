<template lang="pug">
section.game
  header.game__head
    div
      h2.game__title Поки чекаєте — відмийте дзеркало
      p.muted(v-if="mode === 'bonus'")
        | Необовʼязкова розвага. За чисте дзеркало — бонус {{ formatUah(game.bonusAmount) }} на наступне прибирання
        | від {{ formatUah(game.minNextOrder) }}, діє {{ game.validDays }} дн. На поточну заявку не впливає.
      p.muted(v-else) Необовʼязкова розвага на хвилину: проведіть пальцем по плямах.
    AppButton(v-if="!started" variant="soft" @click="start") Грати

  template(v-if="started")
    .game__toolbar(role="group" aria-label="Режим")
      button.game__mode(type="button" :aria-pressed="mode3d === 'clean'" @click="mode3d = 'clean'") Чистити
      button.game__mode(type="button" :aria-pressed="mode3d === 'rotate'" @click="mode3d = 'rotate'") Обертати
      button.game__mode(type="button" @click="restart") Нові плями
    .game__stage
      ClientOnly
        component(
          v-if="canvas && status !== 'unsupported'"
          :is="canvas"
          ref="canvasRef"
          :mode="mode3d"
          :on-progress="onProgress"
          @ready="status = 'ready'"
          @error="status = 'error'"
        )
      .game__overlay(v-if="status === 'loading'" role="status") Готуємо дзеркало…
      .game__overlay(v-else-if="status === 'error'" role="alert")
        span Не вдалося запустити 3D.
        AppButton(size="sm" variant="secondary" @click="load") Спробувати ще
      .game__overlay(v-else-if="status === 'unsupported'" role="note") Гра потребує WebGL, а на цьому пристрої його немає. Заявка від цього не залежить.
    .game__progress
      .game__bar(role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100" aria-label="Відмито")
        .game__fill(:style="{ width: `${percent}%` }")
      span {{ percent }}%
    p.game__hint {{ mode3d === 'clean' ? 'Режим чищення: проводьте по плямах. Щоб подивитися збоку — «Обертати».' : 'Режим повороту: тягніть, щоб роздивитися дзеркало.' }}

  .game__result(v-if="percent >= 100" role="status")
    template(v-if="mode === 'bonus'")
      template(v-if="bonus")
        p
          strong Ваш бонус: {{ bonus.code }}
        p.muted
          | −{{ formatUah(bonus.amount) }} на наступне замовлення від {{ formatUah(bonus.minOrder) }}
          template(v-if="bonus.expiresAt") , до {{ formatDate(bonus.expiresAt.slice(0, 10)) }}
          | . Назвіть код під час дзвінка — власник перевірить і застосує його вручну.
      p(v-else-if="claiming") Видаємо бонус…
      template(v-else-if="claimError")
        p {{ claimError }}
        AppButton(size="sm" variant="secondary" @click="claim") Спробувати ще
    p(v-else)
      strong Блищить!
      |  Дякуємо, що зіграли. Справжнє прибирання — за нами.
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { GameMode, PublicBonus } from '#shared/types'
import { formatUah } from '#shared/pricing'

const props = defineProps<{ token: string; mode: Exclude<GameMode, 'off'>; bonus: PublicBonus | null }>()
const emit = defineEmits<{ bonus: [value: PublicBonus] }>()

const settings = useSettings()
const game = computed(() => settings.value.game)
const started = ref(false)
const status = ref<'loading' | 'ready' | 'error' | 'unsupported'>('loading')
const canvas = shallowRef<Component | null>(null)
const canvasRef = ref<{ reset: () => void } | null>(null)
const mode3d = ref<'clean' | 'rotate'>('clean')
const progress = ref(0)
const claiming = ref(false)
const claimError = ref('')

const percent = computed(() => Math.round(progress.value * 100))

async function load(): Promise<void> {
  status.value = 'loading'
  try {
    canvas.value = markRaw((await import('./CleanGameCanvas.vue')).default)
  } catch {
    status.value = 'error'
  }
}

function start(): void {
  started.value = true
  if (!hasWebGL()) {
    status.value = 'unsupported'
    return
  }
  void load()
}

function onProgress(v: number): void {
  progress.value = v
}

function restart(): void {
  progress.value = 0
  canvasRef.value?.reset()
}

async function claim(): Promise<void> {
  if (props.bonus || claiming.value) return
  claiming.value = true
  claimError.value = ''
  try {
    const res = await $fetch<{ bonus: PublicBonus | null }>(`/api/orders/${props.token}/bonus`, { method: 'POST' })
    if (res.bonus) emit('bonus', res.bonus)
    else claimError.value = 'Бонуси зараз вимкнено власником.'
  } catch {
    claimError.value = 'Не вдалося видати бонус. Перевірте звʼязок.'
  } finally {
    claiming.value = false
  }
}

watch(percent, (p) => {
  if (p >= 100 && props.mode === 'bonus') void claim()
})
</script>

<style lang="scss" scoped>
.game {
  display: grid;
  gap: $sp-3;
  padding: $sp-5;
  border-radius: $r-lg;
  background: $c-surface;
  border: $border dashed $c-line;

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: $sp-3;

    > div {
      display: grid;
      gap: $sp-1;
      max-width: 52ch;
    }
  }

  &__title {
    font-size: $fs-lg;
  }

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: $sp-2;
  }

  &__mode {
    min-height: $tap-sm;
    padding: 0 $sp-4;
    border: $border-strong solid $c-line;
    border-radius: $r-pill;
    background: $c-bg;
    font-weight: $fw-semibold;
    font-size: $fs-sm;

    &[aria-pressed='true'] {
      border-color: $c-accent;
      background: $c-accent-soft;
    }
  }

  &__stage {
    position: relative;
    height: clamp(280px, 70vw, 400px);
    border-radius: $r-md;
    background: radial-gradient(circle at 50% 40%, var(--c-accent-soft), transparent 70%), $c-bg;
    overflow: hidden;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: $sp-2;
    padding: $sp-4;
    text-align: center;
    color: $c-ink-2;
    font-size: $fs-sm;
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: $sp-3;
    font-weight: $fw-bold;
    font-variant-numeric: tabular-nums;
  }

  &__bar {
    flex: 1;
    height: 10px;
    border-radius: $r-pill;
    background: $c-surface-2;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $c-accent;
    transition: width $dur-base $ease-out;
  }

  &__hint {
    font-size: $fs-xs;
    color: $c-ink-3;
  }

  &__result {
    padding: $sp-4;
    border-radius: $r-md;
    background: $c-accent-soft;
    display: grid;
    gap: $sp-2;
    justify-items: start;
  }
}
</style>
