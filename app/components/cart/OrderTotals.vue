<template lang="pug">
.totals
  .totals__row(v-if="estimate.hasKnown")
    span Послуги з відомою ціною
    span {{ formatUah(estimate.knownSum) }}
  .totals__row(v-if="estimate.minimumTopUp > 0")
    span Доплата до мінімального замовлення ({{ formatUah(minOrder) }})
    span +{{ formatUah(estimate.minimumTopUp) }}
  .totals__row(v-if="estimate.travelFee > 0")
    span Виїзд за місто
    span +{{ formatUah(estimate.travelFee) }}
  .totals__row.totals__row--manual(v-if="estimate.manualCount > 0")
    span Позиції з ручною оцінкою
    span {{ estimate.manualCount }} — ціна за фото
  .totals__sum
    span {{ estimate.manualCount > 0 ? 'Відома сума' : 'Орієнтовно разом' }}
    strong {{ estimate.hasKnown || estimate.travelFee > 0 ? formatUah(estimate.total) : 'за фото' }}
  p.totals__fine(v-if="estimate.manualCount > 0 && estimate.hasKnown") + вартість позицій «Інше» після оцінки фото. Вони не безкоштовні.
  p.totals__fine Орієнтовна вартість. Підсумкову ціну й час погодимо телефоном.
</template>

<script setup lang="ts">
import type { OrderEstimate } from '#shared/types'
import { formatUah } from '#shared/pricing'

defineProps<{ estimate: OrderEstimate; minOrder: number }>()
</script>

<style lang="scss" scoped>
.totals {
  display: grid;
  gap: $sp-2;

  &__row {
    display: flex;
    justify-content: space-between;
    gap: $sp-3;
    font-size: $fs-sm;
    color: $c-ink-2;

    span:last-child {
      flex: none;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    &--manual {
      color: $c-ink;
      font-weight: $fw-semibold;
    }
  }

  &__sum {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: $sp-3;
    padding-top: $sp-3;
    border-top: $border solid $c-line;

    strong {
      font-family: $font-display;
      font-size: $fs-2xl;
      font-weight: $fw-semibold;
    }
  }

  &__fine {
    font-size: $fs-xs;
    color: $c-ink-3;
  }
}
</style>
