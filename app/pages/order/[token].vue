<template lang="pug">
.order.container
  .order__loading(v-if="pending && !order" role="status") Завантажуємо заявку…

  .order__missing(v-else-if="error && !order")
    h1.order__title {{ error.statusCode === 404 ? 'Заявку не знайдено' : 'Не вдалося завантажити заявку' }}
    p.muted(v-if="error.statusCode === 404") Перевірте посилання — його можна скопіювати зі сторінки після відправки заявки.
    p.muted(v-else) Схоже, проблема зі звʼязком.
    .order__row
      AppButton(v-if="error.statusCode !== 404" @click="refresh()") Спробувати ще
      AppButton(to="/" variant="secondary") На головну

  template(v-else-if="order")
    .banner(v-if="isNew" role="status")
      strong Заявку збережено.
      |  Ми зателефонуємо, щоб погодити ціну й час. Збережіть посилання на цю сторінку — тут зʼявляться оновлення.

    header.order__head
      p.eyebrow Заявка від {{ formatShort(order.createdAt) }}
      h1.order__title {{ order.firstName ? `${order.firstName}, ` : '' }}{{ headline }}
      .order__status
        StatusBadge(:status="order.status")
        span.muted {{ STATUS_HINTS[order.status] }}

    .order__layout
      .order__main
        section.card
          h2.card__title Посилання на заявку
          p.muted Відкрити заявку можна лише за цим посиланням. Не публікуйте його.
          .link
            input.link__input(:value="pageUrl" readonly aria-label="Посилання на заявку" @focus="selectAll")
            AppButton(size="sm" @click="copyLink") {{ copied ? 'Скопійовано' : 'Копіювати' }}

        section.card
          h2.card__title Ціна й час
          dl.facts
            .facts__row
              dt Підсумкова ціна
              dd
                strong(v-if="order.finalPrice !== null") {{ formatUah(order.finalPrice) }}
                span.muted(v-else) погодимо телефоном
            .facts__row
              dt Час виїзду
              dd
                strong(v-if="order.agreedAt") {{ formatDateTime(order.agreedAt) }}
                span.muted(v-else) ще не погоджено
            .facts__row
              dt Ваше побажання
              dd {{ order.preferredDate ? `${formatDate(order.preferredDate)}${order.preferredTime ? `, ${order.preferredTime}` : ''}` : 'без побажань' }}
            .facts__row
              dt Фото
              dd {{ order.photoCount ? `${order.photoCount} шт. — бачить лише власник` : 'немає' }}
          .order__row
            AppButton(variant="secondary" size="sm" :loading="refreshing" @click="manualRefresh") Оновити статус
            span.order__updated Оновлено {{ lastUpdate }}

        section.card
          h2.card__title Склад
          ul.items
            li(v-for="item in order.items" :key="item.id")
              strong {{ describeItem(item.config).title }}
                span(v-if="item.qty > 1")  × {{ item.qty }}
              span.muted {{ describeItem(item.config).params.join(' · ') }}
              span.muted(v-if="describeItem(item.config).extras.length") + {{ describeItem(item.config).extras.join(', ') }}
          OrderTotals(:estimate="order.estimate" :min-order="order.minOrder")
          p.order__fine Попередній розрахунок за цінами на момент відправки. Зміни прайсу на нього не впливають.

        GameSection(v-if="gameMode !== 'off' && order.status !== 'cancelled'" :token="token" :mode="gameMode" :bonus="order.bonus" @bonus="onBonus")

      aside.order__side
        section.card
          h2.card__title Питання щодо заявки?
          ContactButtons(:show-fallback="false")
          p.muted(v-if="!hasContacts") Ми зателефонуємо на номер із заявки.
        AppButton(to="/calculator" variant="ghost" block) Розрахувати нове прибирання
</template>

<script setup lang="ts">
import type { PublicBonus, PublicOrder } from '#shared/types'
import { STATUS_HINTS } from '#shared/content/services'
import { formatUah } from '#shared/pricing'
import { describeItem } from '~/composables/useItemSummary'

const route = useRoute()
const token = computed(() => String(route.params.token ?? ''))
const isNew = computed(() => route.query.new === '1')
const settings = useSettings()
const gameMode = computed(() => settings.value.game.mode)
const contacts = useContacts()
const hasContacts = computed(() => contacts.value.length > 0)

const { data: order, pending, error, refresh } = await useFetch<PublicOrder>(() => `/api/orders/${token.value}`, {
  server: false,
  key: `order-${token.value}`,
})

const headline = computed(() => {
  const s = order.value?.status
  if (s === 'agreed') return 'чекаємо вас у погоджений час'
  if (s === 'done') return 'прибирання виконано'
  if (s === 'cancelled') return 'заявку скасовано'
  return 'заявку отримано'
})

const pageUrl = ref('')
const copied = ref(false)
const refreshing = ref(false)
const lastUpdate = ref('щойно')
let fetchedAt = Date.now()

watch(order, () => {
  fetchedAt = Date.now()
  lastUpdate.value = 'щойно'
})

function selectAll(e: FocusEvent): void {
  ;(e.target as HTMLInputElement).select()
}

async function copyLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(pageUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2500)
  } catch {
    useToast().show('Не вдалося скопіювати — виділіть посилання вручну', { tone: 'error' })
  }
}

async function manualRefresh(): Promise<void> {
  refreshing.value = true
  await refresh()
  refreshing.value = false
}

function onBonus(bonus: PublicBonus): void {
  if (order.value) order.value = { ...order.value, bonus }
}

let timer: ReturnType<typeof setInterval> | null = null

function onVisible(): void {
  if (document.visibilityState === 'visible' && Date.now() - fetchedAt > 15000) void refresh()
}

onMounted(() => {
  // Drop "?new=1" from the shareable link.
  pageUrl.value = `${window.location.origin}/order/${token.value}`
  timer = setInterval(() => {
    const mins = Math.round((Date.now() - fetchedAt) / 60000)
    lastUpdate.value = mins < 1 ? 'щойно' : `${mins} хв тому`
    if (document.visibilityState === 'visible' && Date.now() - fetchedAt > 60000) void refresh()
  }, 15000)
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
})

useSeoMeta({ title: 'Ваша заявка', robots: 'noindex, nofollow', referrer: 'no-referrer' })
</script>

<style lang="scss" scoped>
.order {
  padding-top: $sp-5;

  &__loading {
    color: $c-ink-3;
  }

  &__missing {
    display: grid;
    gap: $sp-3;
  }

  &__head {
    display: grid;
    gap: $sp-2;
    margin: $sp-5 0;
  }

  &__title {
    font-size: $fs-3xl;
  }

  &__status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $sp-3;
  }

  &__layout {
    display: grid;
    gap: $sp-4;

    @include up($bp-lg) {
      grid-template-columns: 1.6fr 1fr;
      align-items: start;
    }
  }

  &__main,
  &__side {
    display: grid;
    gap: $sp-4;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $sp-3;
  }

  &__updated,
  &__fine {
    font-size: $fs-xs;
    color: $c-ink-3;
  }
}

.banner {
  padding: $sp-4 $sp-5;
  border-radius: $r-md;
  background: $c-accent-soft;
  border: $border solid $c-accent;
}

.card {
  display: grid;
  gap: $sp-3;
  padding: $sp-5;
  border-radius: $r-lg;
  background: $c-surface;
  border: $border solid $c-line;

  &__title {
    font-size: $fs-lg;
  }
}

.link {
  display: flex;
  gap: $sp-2;

  &__input {
    flex: 1;
    min-width: 0;
    min-height: $tap-sm;
    padding: 0 $sp-3;
    border: $border solid $c-line;
    border-radius: $r-sm;
    background: $c-bg;
    color: $c-ink-2;
    font-family: $font-mono;
    font-size: $fs-xs;
  }
}

.facts {
  display: grid;
  gap: $sp-2;
  margin: 0;

  &__row {
    display: flex;
    justify-content: space-between;
    gap: $sp-3;
    padding-bottom: $sp-2;
    border-bottom: $border solid $c-line;
  }

  dt {
    color: $c-ink-2;
  }

  dd {
    margin: 0;
    text-align: right;
  }
}

.items {
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
</style>
