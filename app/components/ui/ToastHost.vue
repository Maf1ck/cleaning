<template lang="pug">
.toasts(aria-live="polite" aria-atomic="false")
  TransitionGroup(name="toast")
    .toast(v-for="t in toasts" :key="t.id" :class="`toast--${t.tone}`" role="status")
      span.toast__text {{ t.text }}
      button.toast__action(v-if="t.action" type="button" @click="run(t)") {{ t.action.label }}
      button.toast__close(type="button" aria-label="Закрити повідомлення" @click="dismiss(t.id)") ×
</template>

<script setup lang="ts">
import type { Toast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

function run(t: Toast): void {
  t.action?.run()
  dismiss(t.id)
}
</script>

<style lang="scss" scoped>
.toasts {
  position: fixed;
  left: 50%;
  bottom: calc(#{$sp-4} + env(safe-area-inset-bottom));
  z-index: $z-toast;
  display: grid;
  gap: $sp-2;
  width: min(440px, calc(100vw - #{$sp-6}));
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: $sp-3;
  padding: $sp-3 $sp-3 $sp-3 $sp-4;
  border-radius: $r-md;
  background: $c-ink;
  color: $c-bg;
  box-shadow: $shadow-2;
  pointer-events: auto;

  &--error {
    background: $c-danger;
    color: $c-surface;
  }

  &__text {
    flex: 1;
    font-size: $fs-sm;
  }

  &__action {
    min-height: $tap-sm;
    padding: 0 $sp-3;
    border: 0;
    border-radius: $r-pill;
    background: $c-sun;
    color: $c-ink;
    font-weight: $fw-bold;
    font-size: $fs-sm;
  }

  &__close {
    width: $tap-sm;
    height: $tap-sm;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    font-size: $fs-xl;
    line-height: 1;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity $dur-base $ease-out,
    transform $dur-base $ease-out;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
