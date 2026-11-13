<template lang="pug">
form.settings-page(@submit.prevent="save")
  header
    h1.settings-page__title Компанія
    p.muted Ці дані показуються на сайті, у контактах і в розмітці для пошукових систем. Порожні контакти на сайті не показуються.

  section.panel
    h2.panel__title Назва
    .form-grid
      label.field
        span.field__label Назва компанії
        input.field__input(v-model.trim="form.name" maxlength="80" required)
      label.field
        span.field__label Короткий опис
        input.field__input(v-model.trim="form.tagline" maxlength="140")
      label.field
        span.field__label Юридична назва
          span.field__optional  — за бажанням
        input.field__input(v-model.trim="form.legalName" maxlength="160" placeholder="ФОП … або ТОВ …")

  section.panel
    h2.panel__title Контакти
    p.muted Вказуйте лише робочі канали. Без телефону кнопка «Подзвонити» на сайті не зʼявиться.
    .form-grid
      label.field
        span.field__label Телефон
        input.field__input(v-model.trim="form.phone" type="tel" placeholder="+380XXXXXXXXX")
        span.field__hint Формат +380 і 9 цифр
      label.field
        span.field__label Telegram
        input.field__input(v-model.trim="form.telegram" placeholder="username без @")
      label.field
        span.field__label Viber
        input.field__input(v-model.trim="form.viber" type="tel" placeholder="+380XXXXXXXXX")
      label.field
        span.field__label Email
        input.field__input(v-model.trim="form.email" type="email")
      label.field
        span.field__label Години роботи
        input.field__input(v-model.trim="form.workHours" maxlength="80")

  section.panel
    h2.panel__title Місто й територія
    .form-grid
      label.field
        span.field__label Місто
        input.field__input(v-model.trim="form.city" maxlength="80" required)
      label.field
        span.field__label Територія обслуговування
        textarea.field__input(v-model.trim="form.serviceArea" rows="2" maxlength="300")

  section.panel
    h2.panel__title Акцентний колір
    .swatches(role="radiogroup" aria-label="Акцентний колір")
      label.swatch(v-for="a in ACCENT_OPTIONS" :key="a.value" :class="{ 'is-active': form.accent === a.value }")
        input.visually-hidden(v-model="form.accent" type="radio" name="accent" :value="a.value")
        span.swatch__dot.accent-dot(:data-accent="a.value")
        span {{ a.label }}
    p.field__hint Повна палітра, логотип і шрифти змінюються в коді (див. docs/ADAPTATION.md).

  section.panel
    h2.panel__title Зберігання персональних даних
    NumberField(v-model="form.retentionDays" label="Знеособлювати виконані й скасовані заявки через" suffix="днів" :min="30" :max="3650" hint="Імʼя, телефон, адреса, коментар, нотатка й фото видаляються; склад і суми лишаються для обліку.")

  SaveBar(:dirty="dirty" :saving="saving" :error="error" @reset="reset")
</template>

<script setup lang="ts">
import type { Accent } from '#shared/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Компанія' })

const ACCENT_OPTIONS: { value: Accent; label: string }[] = [
  { value: 'pine', label: 'Хвоя' },
  { value: 'lagoon', label: 'Лагуна' },
  { value: 'plum', label: 'Слива' },
  { value: 'terracotta', label: 'Теракота' },
]

const { form, saving, error, dirty, save, reset } = useSettingsForm('company')
</script>

<style lang="scss" scoped>
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: $sp-2;
}

.swatch {
  display: inline-flex;
  align-items: center;
  gap: $sp-2;
  min-height: $tap;
  padding: 0 $sp-4 0 $sp-2;
  border: $border-strong solid $c-line;
  border-radius: $r-pill;
  cursor: pointer;
  font-weight: $fw-semibold;

  &.is-active {
    border-color: $c-ink;
  }

  &:has(:focus-visible) {
    @include focus-ring;
  }

  &__dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}
</style>
