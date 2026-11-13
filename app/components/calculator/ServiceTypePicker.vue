<template lang="pug">
fieldset.picker
  legend.picker__legend Тип прибирання
  .picker__grid
    label.picker__card(v-for="s in SERVICES" :key="s.type" :class="{ 'is-active': s.type === modelValue }")
      input.picker__input(type="radio" :name="name" :value="s.type" :checked="s.type === modelValue" @change="emit('update:modelValue', s.type)")
      span.picker__top
        span.picker__title {{ s.title }}
        span.picker__rate {{ rateLabel(s.type, prices) }}
      span.picker__lead {{ s.lead }}
      span.picker__details(v-if="s.type === modelValue")
        span.picker__row
          b Входить:
          |  {{ s.includes.join(', ') }}.
        span.picker__row.picker__row--no
          b Не входить:
          |  {{ s.excludes.join(', ') }}.
</template>

<script setup lang="ts">
import type { CleaningType } from '#shared/types'
import { SERVICES } from '#shared/content/services'
import { rateLabel } from '#shared/pricing'

defineProps<{ modelValue: CleaningType }>()
const emit = defineEmits<{ 'update:modelValue': [value: CleaningType] }>()
const name = useId()
const settings = useSettings()
const prices = computed(() => settings.value.prices)
</script>

<style lang="scss" scoped>
.picker {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;

  &__legend {
    @include visually-hidden;
  }

  &__grid {
    display: grid;
    gap: $sp-2;
  }

  &__card {
    position: relative;
    display: grid;
    gap: $sp-1;
    padding: $sp-3 $sp-4;
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

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: $sp-3;
  }

  &__title {
    font-weight: $fw-bold;
    font-size: $fs-lg;
  }

  &__rate {
    font-weight: $fw-semibold;
    font-size: $fs-sm;
    color: $c-ink-2;
    white-space: nowrap;
  }

  &__lead {
    font-size: $fs-sm;
    color: $c-ink-2;
  }

  &__details {
    display: grid;
    gap: $sp-1;
    margin-top: $sp-2;
    padding-top: $sp-2;
    border-top: $border solid $c-line;
    font-size: $fs-sm;
  }

  &__row--no {
    color: $c-ink-2;
  }
}
</style>
