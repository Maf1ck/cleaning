<template lang="pug">
dialog.confirm(ref="dialog" @close="onClose" @cancel.prevent="answer(false)")
  form.confirm__body(method="dialog" @submit.prevent="answer(true)")
    h2.confirm__title {{ title }}
    p.confirm__text {{ text }}
    .confirm__actions
      AppButton(variant="secondary" @click="answer(false)") Скасувати
      AppButton(type="submit" :variant="danger ? 'danger' : 'primary'") {{ confirmLabel }}
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ open: boolean; title: string; text: string; confirmLabel?: string; danger?: boolean }>(), {
  confirmLabel: 'Підтвердити',
  danger: false,
})
const emit = defineEmits<{ answer: [ok: boolean] }>()
const dialog = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (open) => {
    if (!dialog.value) return
    if (open && !dialog.value.open) dialog.value.showModal()
    if (!open && dialog.value.open) dialog.value.close()
  },
)

function answer(ok: boolean): void {
  emit('answer', ok)
}

function onClose(): void {
  if (props.open) emit('answer', false)
}
</script>

<style lang="scss" scoped>
.confirm {
  width: min(440px, calc(100vw - #{$sp-6}));
  padding: 0;
  border: 0;
  border-radius: $r-lg;
  background: $c-surface;
  color: $c-ink;
  box-shadow: $shadow-2;

  &::backdrop {
    background: $c-overlay;
  }

  &__body {
    display: grid;
    gap: $sp-4;
    padding: $sp-5;
  }

  &__title {
    font-size: $fs-xl;
  }

  &__text {
    color: $c-ink-2;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: $sp-2;
  }
}
</style>
