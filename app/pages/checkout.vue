<template lang="pug">
.checkout.container
  header.checkout__head
    NuxtLink.checkout__back(to="/cart") ← Кошик
    h1.checkout__title Оформлення заявки
    p.muted Це заявка, а не оплата. Ми зателефонуємо, щоб погодити ціну й час виїзду.

  p.muted(v-if="!cart.ready") Завантажуємо…

  .empty(v-else-if="cart.items.length === 0")
    h2 Кошик порожній
    p.muted Спочатку оберіть послугу.
    AppButton(to="/calculator") Розрахувати вартість

  .checkout__layout(v-else)
    form.checkout__form(ref="formEl" novalidate @submit.prevent="submit")
      fieldset.group
        legend.group__title Контакти
        .group__grid
          label.field
            span.field__label Імʼя
            input.field__input(
              v-model.trim="d.name"
              name="name"
              autocomplete="given-name"
              :maxlength="LIMITS.name.max"
              :aria-invalid="Boolean(errors['customer.name'])"
              aria-describedby="err-name"
            )
            span#err-name.field__error(v-if="errors['customer.name']") {{ errors['customer.name'] }}
          label.field
            span.field__label Телефон
            input.field__input(
              :value="d.phone"
              name="phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="+380XXXXXXXXX"
              :aria-invalid="Boolean(errors['customer.phone'])"
              aria-describedby="err-phone hint-phone"
              @input="onPhone"
            )
            span#hint-phone.field__hint(v-if="!errors['customer.phone']") Формат +380 і 9 цифр
            span#err-phone.field__error(v-else) {{ errors['customer.phone'] }}

      fieldset.group
        legend.group__title Адреса
        label.field
          span.field__label Адреса прибирання
          textarea.field__input(
            v-model="d.address"
            name="address"
            rows="2"
            autocomplete="street-address"
            :maxlength="LIMITS.address.max"
            placeholder="Вулиця, будинок, підʼїзд, поверх, квартира"
            :aria-invalid="Boolean(errors['customer.address'])"
            aria-describedby="err-address hint-address"
          )
          span#hint-address.field__hint(v-if="!errors['customer.address']") Коди домофона, ключі й паролі не пишіть — обговоримо телефоном.
          span#err-address.field__error(v-else) {{ errors['customer.address'] }}
        ToggleSwitch(
          v-model="d.outOfCity"
          label="Адреса за межами міста"
          :hint="`${company.city}: ${company.serviceArea} Доплата за виїзд +${formatUah(prices.outOfCityFee)}.`"
        )

      fieldset.group
        legend.group__title Бажаний час
          span.field__optional  — необовʼязково
        .group__grid
          label.field
            span.field__label Дата
            input.field__input(
              v-model="d.preferredDate"
              type="date"
              :min="minDate"
              :max="maxDate"
              :aria-invalid="Boolean(errors.preferredDate)"
              aria-describedby="err-date"
            )
            span#err-date.field__error(v-if="errors.preferredDate") {{ errors.preferredDate }}
          label.field
            span.field__label Час
            select.field__input(v-model="d.preferredTime" :disabled="!d.preferredDate" aria-describedby="hint-time")
              option(value="") Будь-який
              option(v-for="t in TIME_SLOTS" :key="t" :value="t") {{ t }}
            span#hint-time.field__hint {{ d.preferredDate ? 'Майстер підтвердить після розмови' : 'Спочатку оберіть дату' }}

      fieldset.group
        legend.group__title Фото й коментар
        PhotoUploader(
          v-model="d.photos"
          :required="needsPhoto"
          :error="errors.photoTokens"
          @busy="uploading = $event"
        )
        label.field
          span.field__label
            | Коментар
            span.field__optional  — за бажанням
          textarea.field__input(
            v-model="d.comment"
            rows="3"
            :maxlength="LIMITS.comment.max"
            placeholder="Домашні тварини, алергії, особливості приміщення, що треба зробити насамперед"
          )

      fieldset.group
        legend.visually-hidden Згода
        label.check
          input(v-model="d.consent" type="checkbox" :aria-invalid="Boolean(errors.consent)" aria-describedby="err-consent")
          span
            | Погоджуюся на обробку персональних даних для виконання заявки відповідно до
            |
            NuxtLink(to="/privacy" target="_blank") політики конфіденційності
            | .
        span#err-consent.field__error(v-if="errors.consent") {{ errors.consent }}

      .banner.banner--error(v-if="submitError" role="alert")
        p {{ submitError }}
        AppButton(v-if="canRetry" size="sm" variant="secondary" :loading="sending" @click="submit") Надіслати ще раз
      AppButton(type="submit" size="lg" block :loading="sending" :disabled="uploading") {{ uploading ? 'Завантажуємо фото…' : 'Надіслати заявку' }}
      p.checkout__fine Онлайн-оплати немає. Повторне натискання не створить другу заявку.

    aside.checkout__summary
      h2.checkout__summary-title Склад заявки
      ul.summary
        li(v-for="item in cart.items" :key="item.id")
          strong {{ describeItem(item.config).title }}
            span(v-if="item.qty > 1")  × {{ item.qty }}
          span.muted {{ describeItem(item.config).params.join(' · ') }}
      OrderTotals(:estimate="estimate" :min-order="prices.minOrder")
</template>

<script setup lang="ts">
import { LIMITS, PHONE_RE, TIME_SLOTS } from '#shared/limits'
import { formatUah } from '#shared/pricing'
import { describeItem } from '~/composables/useItemSummary'

const cart = useCartStore()
const draftStore = useDraftStore()
const d = computed(() => draftStore.draft)
const settings = useSettings()
const prices = computed(() => settings.value.prices)
const company = computed(() => settings.value.company)

const formEl = ref<HTMLFormElement | null>(null)
const errors = ref<Record<string, string>>({})
const sending = ref(false)
const uploading = ref(false)
const submitError = ref('')
const canRetry = ref(false)

const estimate = computed(() => cart.estimate(d.value.outOfCity))
const needsPhoto = computed(() => cart.items.some((i) => i.config.type === 'other'))

function isoDay(offsetDays: number): string {
  const t = new Date(Date.now() + offsetDays * 86400000)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}
const minDate = isoDay(0)
const maxDate = isoDay(180)

watch(
  () => d.value.preferredDate,
  (date) => {
    if (!date) d.value.preferredTime = ''
  },
)

// Clear an error as soon as the visitor edits the field.
watch(
  () => ({ ...d.value, photos: d.value.photos.length }),
  (now, before) => {
    if (!before) return
    const map: Record<string, keyof typeof now> = {
      'customer.name': 'name',
      'customer.phone': 'phone',
      'customer.address': 'address',
      preferredDate: 'preferredDate',
      photoTokens: 'photos',
      consent: 'consent',
    }
    for (const [key, field] of Object.entries(map)) {
      if (errors.value[key] && now[field] !== before[field]) {
        const next = { ...errors.value }
        delete next[key]
        errors.value = next
      }
    }
  },
)

function onPhone(e: Event): void {
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  if (!digits) {
    d.value.phone = '+380'
    return
  }
  let rest = digits
  if (rest.startsWith('380')) rest = rest.slice(3)
  else if (rest.startsWith('0')) rest = rest.slice(1)
  d.value.phone = `+380${rest.slice(0, 9)}`
}

function validate(): Record<string, string> {
  const e: Record<string, string> = {}
  if (d.value.name.trim().length < 2) e['customer.name'] = 'Вкажіть імʼя'
  if (!PHONE_RE.test(d.value.phone)) e['customer.phone'] = 'Телефон у форматі +380XXXXXXXXX'
  if (d.value.address.trim().length < 5) e['customer.address'] = 'Вкажіть адресу'
  if (d.value.preferredTime && !d.value.preferredDate) e.preferredDate = 'Для конкретного часу оберіть дату'
  if (needsPhoto.value && d.value.photos.length === 0) e.photoTokens = 'Для «Інше» додайте хоча б одне фото'
  if (!d.value.consent) e.consent = 'Потрібна згода на обробку даних'
  return e
}

function focusFirstError(): void {
  void nextTick(() => {
    const el = formEl.value?.querySelector<HTMLElement>('[aria-invalid="true"]')
    el?.focus()
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

interface FetchErr {
  statusCode?: number
  data?: { message?: string; data?: { fields?: Record<string, string> } }
}

async function submit(): Promise<void> {
  if (sending.value || uploading.value) return
  submitError.value = ''
  canRetry.value = false
  errors.value = validate()
  if (Object.keys(errors.value).length) {
    focusFirstError()
    return
  }
  sending.value = true
  const idempotencyKey = draftStore.ensureKey()
  try {
    const res = await $fetch<{ token: string }>('/api/orders', {
      method: 'POST',
      body: {
        idempotencyKey,
        items: cart.items.map((i) => ({ id: i.id, qty: i.qty, config: i.config })),
        customer: { name: d.value.name, phone: d.value.phone, address: d.value.address, outOfCity: d.value.outOfCity },
        preferredDate: d.value.preferredDate,
        preferredTime: d.value.preferredTime,
        comment: d.value.comment,
        photoTokens: d.value.photos.map((p) => p.token),
        consent: d.value.consent,
      },
      retry: 0,
      timeout: 20000,
    })
    // The order is stored in the database at this point.
    cart.clear()
    draftStore.reset()
    await navigateTo(`/order/${res.token}?new=1`)
  } catch (e) {
    const err = e as FetchErr
    const fields = err.data?.data?.fields
    if (err.statusCode === 422 && fields) {
      errors.value = fields
      if (fields.photoTokens) d.value.photos = []
      submitError.value = err.data?.message ?? 'Перевірте поля форми'
      focusFirstError()
    } else if (err.statusCode === 429) {
      submitError.value = 'Забагато спроб. Зачекайте кілька хвилин — ваші дані збережено.'
      canRetry.value = true
    } else {
      submitError.value = 'Не вдалося надіслати заявку — схоже, проблема зі звʼязком. Дані збережено, спробуйте ще раз: дубля не буде.'
      canRetry.value = true
    }
  } finally {
    sending.value = false
  }
}

usePageSeo({ title: 'Оформлення заявки', description: 'Контакти й адреса для заявки на прибирання.', path: '/checkout', noindex: true })
</script>

<style lang="scss" scoped>
.checkout {
  padding-top: $sp-5;

  &__head {
    display: grid;
    gap: $sp-2;
    margin-bottom: $sp-5;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    min-height: $tap-sm;
    width: fit-content;
    color: $c-ink-2;
    text-decoration: none;

    &:hover {
      color: $c-ink;
    }
  }

  &__title {
    font-size: $fs-3xl;
  }

  &__layout {
    display: grid;
    gap: $sp-5;

    @include up($bp-lg) {
      grid-template-columns: 1.5fr 1fr;
      align-items: start;
    }
  }

  &__form {
    display: grid;
    gap: $sp-4;
  }

  &__fine {
    font-size: $fs-xs;
    color: $c-ink-3;
    text-align: center;
  }

  &__summary {
    display: grid;
    gap: $sp-4;
    padding: $sp-5;
    border-radius: $r-lg;
    background: $c-surface;
    border: $border solid $c-line;

    @include up($bp-lg) {
      position: sticky;
      top: calc(#{$header-h} + #{$sp-4});
      order: 2;
    }
  }

  &__summary-title {
    font-size: $fs-xl;
  }
}

.group {
  display: grid;
  gap: $sp-4;
  margin: 0;
  padding: $sp-5;
  border: $border solid $c-line;
  border-radius: $r-lg;
  background: $c-surface;
  min-width: 0;

  &__title {
    float: left;
    width: 100%;
    margin-bottom: $sp-1;
    padding: 0;
    font-family: $font-display;
    font-size: $fs-lg;
    font-weight: $fw-medium;

    + * {
      clear: both;
    }
  }

  &__grid {
    display: grid;
    gap: $sp-4;

    @include up($bp-sm) {
      grid-template-columns: 1fr 1fr;
    }
  }
}

.summary {
  display: grid;
  gap: $sp-3;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    gap: 2px;
    font-size: $fs-sm;
  }
}

.banner {
  display: grid;
  gap: $sp-3;
  justify-items: start;
  padding: $sp-4;
  border-radius: $r-md;

  &--error {
    background: $c-danger-soft;
    color: $c-ink;
    border: $border solid $c-danger;
  }
}

.empty {
  display: grid;
  gap: $sp-3;
  justify-items: start;
}
</style>
