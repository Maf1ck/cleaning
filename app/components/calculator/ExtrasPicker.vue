<template lang="pug">
fieldset.extras
  legend.extras__legend Додаткові послуги
  ul.extras__list
    li.extras__row(v-for="id in EXTRA_IDS" :key="id" :class="{ 'is-on': (modelValue[id] ?? 0) > 0 }")
      .extras__info
        span.extras__title {{ EXTRA_LABELS[id].title }}
        span.extras__price {{ formatUah(prices.extras[id]) }} / {{ EXTRA_LABELS[id].unit }}
      NumberStepper(
        compact
        :model-value="modelValue[id] ?? 0"
        :min="LIMITS.extra.min"
        :max="LIMITS.extra.max"
        :label="EXTRA_LABELS[id].title"
        hint=" "
        @update:model-value="set(id, $event)"
      )
</template>

<script setup lang="ts">
import { EXTRA_IDS } from '#shared/types'
import type { ExtraId } from '#shared/types'
import { EXTRA_LABELS } from '#shared/content/services'
import { LIMITS } from '#shared/limits'
import { formatUah } from '#shared/pricing'

const props = defineProps<{ modelValue: Partial<Record<ExtraId, number>> }>()
const emit = defineEmits<{ 'update:modelValue': [value: Partial<Record<ExtraId, number>>] }>()
const settings = useSettings()
const prices = computed(() => settings.value.prices)

function set(id: ExtraId, value: number): void {
  emit('update:modelValue', { ...props.modelValue, [id]: value })
}
</script>

<style lang="scss" scoped>
.extras {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;

  &__legend {
    @include visually-hidden;
  }

  &__list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $sp-3;
    padding: $sp-2 0;
    border-bottom: $border solid $c-line;

    &:last-child {
      border-bottom: 0;
    }

    :deep(.stepper__label),
    :deep(.stepper__hint) {
      @include visually-hidden;
    }
  }

  &__info {
    display: grid;
  }

  &__title {
    font-weight: $fw-semibold;
  }

  &__price {
    font-size: $fs-sm;
    color: $c-ink-2;
  }

  .is-on &__title {
    color: $c-accent;
  }
}
</style>
