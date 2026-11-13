<template lang="pug">
.savebar
  p.savebar__error(v-if="error" role="alert") {{ error }}
  p.savebar__state(v-else) {{ dirty ? 'Є незбережені зміни' : 'Усе збережено' }}
  .savebar__actions
    AppButton(variant="ghost" size="sm" :disabled="!dirty || saving" @click="emit('reset')") Скасувати
    AppButton(type="submit" size="sm" :loading="saving" :disabled="!dirty") Зберегти
</template>

<script setup lang="ts">
defineProps<{ dirty: boolean; saving: boolean; error: string }>()
const emit = defineEmits<{ reset: [] }>()
</script>

<style lang="scss" scoped>
.savebar {
  position: sticky;
  bottom: 0;
  z-index: $z-sticky;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $sp-3;
  padding: $sp-3 $sp-4 calc(#{$sp-3} + env(safe-area-inset-bottom));
  margin: 0 (-$sp-4);
  background: $c-surface;
  border-top: $border solid $c-line;

  &__state {
    color: $c-ink-3;
    font-size: $fs-sm;
  }

  &__error {
    color: $c-danger;
    font-size: $fs-sm;
    font-weight: $fw-semibold;
  }

  &__actions {
    display: flex;
    gap: $sp-2;
  }
}
</style>
