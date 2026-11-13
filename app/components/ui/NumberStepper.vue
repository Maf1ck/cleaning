<template lang="pug">
.stepper(:class="{ 'stepper--compact': compact }")
  label.stepper__label(v-if="label" :for="inputId") {{ label }}
  .stepper__control
    button.stepper__btn(
      type="button"
      :disabled="modelValue <= min"
      :aria-label="`Зменшити: ${label || ''}`"
      @click="change(-step)"
    ) −
    .stepper__value
      input.stepper__input(
        :id="inputId"
        type="text"
        inputmode="numeric"
        :value="draft"
        :aria-describedby="hintId"
        @input="onInput"
        @blur="commit"
        @keydown.enter.prevent="commit"
        @keydown.up.prevent="change(step)"
        @keydown.down.prevent="change(-step)"
      )
      span.stepper__unit(v-if="unit" aria-hidden="true") {{ unit }}
    button.stepper__btn(
      type="button"
      :disabled="modelValue >= max"
      :aria-label="`Збільшити: ${label || ''}`"
      @click="change(step)"
    ) +
  p.stepper__hint(:id="hintId") {{ hint || `від ${min} до ${max}` }}
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    min: number
    max: number
    step?: number
    label?: string
    unit?: string
    hint?: string
    compact?: boolean
  }>(),
  { step: 1, label: '', unit: '', hint: '', compact: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const inputId = useId()
const hintId = useId()
const draft = ref(String(props.modelValue))

watch(
  () => props.modelValue,
  (v) => {
    draft.value = String(v)
  },
)

function clampValue(v: number): number {
  return Math.min(props.max, Math.max(props.min, Math.round(v)))
}

function change(delta: number): void {
  emit('update:modelValue', clampValue(props.modelValue + delta))
}

function onInput(e: Event): void {
  const target = e.target as HTMLInputElement
  draft.value = target.value.replace(/\D/g, '').slice(0, 4)
}

function commit(): void {
  const n = Number(draft.value)
  const next = draft.value === '' || !Number.isFinite(n) ? props.modelValue : clampValue(n)
  draft.value = String(next)
  if (next !== props.modelValue) emit('update:modelValue', next)
}
</script>

<style lang="scss" scoped>
.stepper {
  display: grid;
  gap: $sp-2;

  &__label {
    font-weight: $fw-semibold;
  }

  &__control {
    display: flex;
    align-items: center;
    gap: $sp-1;
    padding: $sp-1;
    background: $c-surface-2;
    border-radius: $r-pill;
    width: fit-content;
  }

  &__btn {
    width: $tap;
    height: $tap;
    border: 0;
    border-radius: 50%;
    background: $c-surface;
    color: $c-ink;
    font-size: $fs-xl;
    line-height: 1;
    box-shadow: $shadow-1;
    transition: transform $dur-fast $ease-out;

    &:active:not(:disabled) {
      transform: scale(0.92);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  &__value {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: $sp-1;
    min-width: 88px;
  }

  &__input {
    width: 4.5ch;
    border: 0;
    background: transparent;
    text-align: center;
    font-size: $fs-xl;
    font-weight: $fw-semibold;
    font-variant-numeric: tabular-nums;
    border-radius: $r-sm;

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__unit {
    color: $c-ink-2;
    font-size: $fs-sm;
  }

  &__hint {
    font-size: $fs-xs;
    color: $c-ink-3;
  }

  &--compact {
    .stepper__btn {
      width: $tap-sm;
      height: $tap-sm;
      font-size: $fs-lg;
    }

    .stepper__value {
      min-width: 44px;
    }

    .stepper__input {
      font-size: $fs-md;
      width: 3ch;
    }
  }
}
</style>
