<template lang="pug">
form.settings(@submit.prevent="save")
  header
    h1.settings__title Тарифи
    p.muted Нові ціни діють для нових заявок. Уже надіслані заявки зберігають прайс на момент відправки.

  section.card
    h2.card__title Ціна за м²
    .grid
      NumberField(v-model="form.perM2.maintenance" label="Підтримуюче" suffix="₴/м²")
      NumberField(v-model="form.perM2.general" label="Генеральне" suffix="₴/м²")
      NumberField(v-model="form.perM2.renovation" label="Після ремонту" suffix="₴/м²")
      NumberField(v-model="form.bathroomExtra" label="Кожен санвузол понад перший" hint="0 — не доплачувати")

  section.card
    h2.card__title Миття вікон
    .grid
      NumberField(v-model="form.windows.perSash" label="За стулку" suffix="₴/шт")
      NumberField(v-model="form.windows.balcony" label="Балкон або лоджія")

  section.card
    h2.card__title Додаткові послуги
    .grid
      NumberField(v-for="id in EXTRA_IDS" :key="id" v-model="form.extras[id]" :label="EXTRA_LABELS[id].title" :suffix="`₴/${EXTRA_LABELS[id].unit}`")

  section.card
    h2.card__title Мінімум, надбавки, знижки
    .grid
      NumberField(v-model="form.minOrder" label="Мінімальне замовлення" hint="Для прибирання, без виїзду")
      NumberField(v-model="form.outOfCityFee" label="Доплата за виїзд за місто")
      NumberField(v-model="form.heavyDirtPct" label="Сильне забруднення" suffix="%" :max="200")
      NumberField(v-model="form.regularDiscountPct.weekly" label="Знижка: щотижня" suffix="%" :max="90")
      NumberField(v-model="form.regularDiscountPct.biweekly" label="Знижка: раз на два тижні" suffix="%" :max="90")
      NumberField(v-model="form.regularDiscountPct.monthly" label="Знижка: раз на місяць" suffix="%" :max="90")
      label.field
        span.field__label Заокруглення
        select.field__input(v-model.number="form.roundTo")
          option(v-for="r in ROUNDING" :key="r" :value="r") до {{ r }} ₴

  section.card.preview
    h2.card__title Приклад із цими цінами
    p.muted Генеральне, 60 м², 2 санвузли, духовка, сильне забруднення, щотижня:
    PriceLines(:estimate="example")

  SaveBar(:dirty="dirty" :saving="saving" :error="error" @reset="reset")
</template>

<script setup lang="ts">
import { EXTRA_IDS } from '#shared/types'
import { EXTRA_LABELS } from '#shared/content/services'
import { defaultConfig } from '#shared/limits'
import { estimateItem } from '#shared/pricing'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Тарифи' })

const ROUNDING = [1, 5, 10, 50, 100] as const
const { form, saving, error, dirty, save, reset } = useSettingsForm('prices')

const example = computed(() =>
  estimateItem({ ...defaultConfig('general'), area: 60, bathrooms: 2, extras: { oven: 1 }, heavyDirt: true, frequency: 'weekly' }, form.value),
)
</script>

<style lang="scss" scoped>
.settings {
  display: grid;
  gap: $sp-4;

  &__title {
    font-size: $fs-2xl;
    margin-bottom: $sp-1;
  }
}

.card {
  display: grid;
  gap: $sp-4;
  padding: $sp-5;
  border-radius: $r-lg;
  background: $c-surface;
  border: $border solid $c-line;

  &__title {
    font-size: $fs-lg;
  }
}

.grid {
  display: grid;
  gap: $sp-4;

  @include up($bp-sm) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

.preview {
  border-color: $c-accent;
}
</style>
