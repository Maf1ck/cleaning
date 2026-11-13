<template lang="pug">
label.field.num
  span.field__label {{ label }}
  .num__wrap
    input.field__input(
      type="number"
      inputmode="decimal"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      @input="onInput"
    )
    span.num__suffix(v-if="suffix" aria-hidden="true") {{ suffix }}
  span.field__hint(v-if="hint") {{ hint }}
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: number; label: string; suffix?: string; hint?: string; min?: number; max?: number; step?: number }>(), {
  suffix: '₴',
  hint: '',
  min: 0,
  max: 100000,
  step: 1,
})
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function onInput(e: Event): void {
  const v = Number((e.target as HTMLInputElement).value)
  if (Number.isFinite(v)) emit('update:modelValue', Math.min(props.max, Math.max(props.min, v)))
}
</script>

<style lang="scss" scoped>
.num {
  &__wrap {
    position: relative;
  }

  &__wrap .field__input {
    padding-right: $sp-7;
  }

  &__suffix {
    position: absolute;
    right: $sp-4;
    top: 50%;
    transform: translateY(-50%);
    color: $c-ink-3;
    pointer-events: none;
  }
}
</style>
