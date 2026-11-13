<template lang="pug">
fieldset.segmented
  legend.segmented__legend {{ legend }}
  .segmented__options
    label.segmented__option(v-for="opt in options" :key="opt.value" :class="{ 'is-active': opt.value === modelValue }")
      input.segmented__input(
        type="radio"
        :name="name"
        :value="opt.value"
        :checked="opt.value === modelValue"
        @change="emit('update:modelValue', opt.value)"
      )
      span.segmented__title {{ opt.label }}
      span.segmented__badge(v-if="opt.badge") {{ opt.badge }}
</template>

<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T
  legend: string
  options: { value: T; label: string; badge?: string }[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
const name = useId()
</script>

<style lang="scss" scoped>
.segmented {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;

  &__legend {
    margin-bottom: $sp-2;
    padding: 0;
    font-weight: $fw-semibold;
  }

  &__options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $sp-2;

    @include up($bp-sm) {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }
  }

  &__option {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-height: 56px;
    padding: $sp-2 $sp-3;
    border: $border-strong solid $c-line;
    border-radius: $r-md;
    background: $c-surface;
    cursor: pointer;
    transition:
      border-color $dur-fast $ease-out,
      background-color $dur-fast $ease-out;

    &:hover {
      border-color: $c-ink-3;
    }

    &.is-active {
      border-color: $c-accent;
      background: $c-accent-soft;
    }

    &:has(:focus-visible) {
      @include focus-ring;
    }
  }

  &__input {
    @include visually-hidden;
  }

  &__title {
    font-weight: $fw-semibold;
    font-size: $fs-sm;
    line-height: $lh-snug;
  }

  &__badge {
    font-size: $fs-xs;
    font-weight: $fw-bold;
    color: $c-accent;
  }
}
</style>
