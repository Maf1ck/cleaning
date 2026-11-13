<template lang="pug">
.lines
  template(v-if="estimate.manual")
    p.lines__manual
      strong Вартість — за фото.
      |  Додайте фото під час оформлення: ми оцінимо й назвемо ціну до виїзду.
  template(v-else)
    ul.lines__list
      li.lines__row(v-for="(l, i) in estimate.lines" :key="i" :class="`lines__row--${l.kind}`")
        span {{ l.label }}
        span.lines__amount {{ signed(l.amount) }}
    .lines__total
      span {{ qty > 1 ? `Разом за ${qty} шт.` : 'Орієнтовно' }}
      strong {{ formatUah((estimate.unit ?? 0) * qty) }}
</template>

<script setup lang="ts">
import type { ItemEstimate } from '#shared/types'
import { formatUah } from '#shared/pricing'

withDefaults(defineProps<{ estimate: ItemEstimate; qty?: number }>(), { qty: 1 })

function signed(n: number): string {
  if (n < 0) return `−${formatUah(Math.abs(n))}`
  return formatUah(n)
}
</script>

<style lang="scss" scoped>
.lines {
  display: grid;
  gap: $sp-3;

  &__list {
    display: grid;
    gap: $sp-1;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: $fs-sm;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    gap: $sp-3;
    color: $c-ink-2;

    &--discount {
      color: $c-success;
    }

    &--rounding {
      color: $c-ink-3;
      font-size: $fs-xs;
    }
  }

  &__amount {
    flex: none;
    font-variant-numeric: tabular-nums;
  }

  &__total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: $sp-2;
    border-top: $border solid $c-line;

    strong {
      font-family: $font-display;
      font-size: $fs-2xl;
      font-weight: $fw-semibold;
    }
  }

  &__manual {
    padding: $sp-3;
    border-radius: $r-md;
    background: $c-sun-soft;
    font-size: $fs-sm;
  }
}
</style>
