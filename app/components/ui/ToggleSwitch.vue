<template lang="pug">
label.toggle
  input.toggle__input(
    type="checkbox"
    role="switch"
    :checked="modelValue"
    :disabled="disabled"
    @change="onChange"
  )
  span.toggle__track(aria-hidden="true")
    span.toggle__thumb
  span.toggle__text
    span.toggle__label {{ label }}
    span.toggle__hint(v-if="hint") {{ hint }}
</template>

<script setup lang="ts">
withDefaults(defineProps<{ modelValue: boolean; label: string; hint?: string; disabled?: boolean }>(), { hint: '', disabled: false })
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function onChange(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}
</script>

<style lang="scss" scoped>
.toggle {
  display: flex;
  align-items: center;
  gap: $sp-3;
  min-height: $tap;
  cursor: pointer;

  &__input {
    @include visually-hidden;
  }

  &__track {
    position: relative;
    flex: none;
    width: 52px;
    height: 32px;
    border-radius: $r-pill;
    background: $c-line;
    transition: background-color $dur-base $ease-out;
  }

  &__thumb {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: $c-surface;
    box-shadow: $shadow-1;
    transition: transform $dur-base $ease-spring;
  }

  &__input:checked + &__track {
    background: $c-accent;
  }

  &__input:checked + &__track &__thumb {
    transform: translateX(20px);
  }

  &__input:focus-visible + &__track {
    @include focus-ring;
  }

  &__input:disabled ~ * {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__text {
    display: grid;
  }

  &__label {
    font-weight: $fw-semibold;
  }

  &__hint {
    font-size: $fs-sm;
    color: $c-ink-2;
  }
}
</style>
