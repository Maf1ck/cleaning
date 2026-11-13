<template lang="pug">
.orders
  header.orders__head
    h1.orders__title Заявки
    AppButton(variant="secondary" size="sm" :loading="loading" @click="load(true)") Оновити

  .filters
    label.field.filters__search
      span.visually-hidden Пошук
      input.field__input(v-model="q" type="search" placeholder="Імʼя, телефон, адреса, коментар" @input="debouncedLoad")
    .filters__chips(role="group" aria-label="Статус")
      button.chip(v-for="s in statusFilters" :key="s.value" type="button" :aria-pressed="status === s.value" @click="setStatus(s.value)")
        | {{ s.label }}
        span.chip__count(v-if="s.count !== undefined") {{ s.count }}
    label.field.filters__period
      span.visually-hidden Період
      select.field__input(v-model="period" @change="load(true)")
        option(value="all") За весь час
        option(value="today") За добу
        option(value="7d") 7 днів
        option(value="30d") 30 днів

  p.orders__error(v-if="error" role="alert") {{ error }}
  p.muted(v-else-if="!loading && list.length === 0") {{ totalOrders === 0 ? 'Заявок поки немає. Нові зʼявляться тут.' : 'Нічого не знайдено за цими фільтрами.' }}

  ul.list
    li(v-for="o in list" :key="o.id")
      NuxtLink.row(:to="`/admin/orders/${o.id}`")
        .row__top
          StatusBadge(:status="o.status")
          span.row__date {{ formatShort(o.createdAt) }}
        .row__name {{ o.name }}
          span.row__phone {{ o.phone ? formatPhone(o.phone) : '' }}
        .row__meta {{ o.types.map((t) => TYPE_LABELS[t]).join(' + ') }}
          span(v-if="o.photoCount")  · фото: {{ o.photoCount }}
          span(v-if="o.outOfCity")  · за місто
        .row__bottom
          span.row__when
            template(v-if="o.agreedAt") Погоджено: {{ formatShort(o.agreedAt) }}
            template(v-else-if="o.preferredDate") Бажано: {{ formatDate(o.preferredDate) }} {{ o.preferredTime ?? '' }}
            template(v-else) Час не вказано
          span.row__price
            template(v-if="o.finalPrice !== null") {{ formatUah(o.finalPrice) }}
            template(v-else)
              | ≈ {{ formatUah(o.estimateTotal) }}
              span(v-if="o.manualCount")  + за фото

  AppButton.orders__more(v-if="hasMore" variant="secondary" block :loading="loading" @click="loadMore") Показати ще
</template>

<script setup lang="ts">
import type { AdminOrderList, AdminOrderSummary } from '#shared/adminTypes'
import { ORDER_STATUSES } from '#shared/types'
import type { OrderStatus } from '#shared/types'
import { STATUS_LABELS, TYPE_LABELS } from '#shared/content/services'
import { formatUah } from '#shared/pricing'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Заявки' })

type StatusFilter = OrderStatus | 'all'

const q = ref('')
const status = ref<StatusFilter>('new')
const period = ref<'all' | 'today' | '7d' | '30d'>('all')
const page = ref(1)
const list = ref<AdminOrderSummary[]>([])
const counts = ref<Record<string, number>>({})
const hasMore = ref(false)
const loading = ref(false)
const error = ref('')

const totalOrders = computed(() => Object.values(counts.value).reduce((sum, n) => sum + n, 0))

const statusFilters = computed(() => [
  ...ORDER_STATUSES.map((s) => ({ value: s as StatusFilter, label: STATUS_LABELS[s], count: counts.value[s] ?? 0 })),
  { value: 'all' as StatusFilter, label: 'Усі', count: undefined },
])

async function load(reset = false): Promise<void> {
  if (reset) page.value = 1
  loading.value = true
  error.value = ''
  try {
    const res = await adminFetch<AdminOrderList>('/api/admin/orders', { query: { q: q.value, status: status.value, period: period.value, page: page.value } })
    list.value = page.value === 1 ? res.orders : [...list.value, ...res.orders]
    counts.value = res.counts
    hasMore.value = res.hasMore
  } catch (e) {
    error.value = adminErrorMessage(e, 'Не вдалося завантажити заявки')
  } finally {
    loading.value = false
  }
}

let t: ReturnType<typeof setTimeout> | null = null
function debouncedLoad(): void {
  if (t) clearTimeout(t)
  t = setTimeout(() => void load(true), 300)
}

function setStatus(s: StatusFilter): void {
  status.value = s
  void load(true)
}

function loadMore(): void {
  page.value += 1
  void load()
}

let poll: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  void load(true)
  // Light auto-refresh of the first page while the tab is open.
  poll = setInterval(() => {
    if (document.visibilityState === 'visible' && page.value === 1 && !loading.value) void load(true)
  }, 60000)
})
onBeforeUnmount(() => {
  if (poll) clearInterval(poll)
  if (t) clearTimeout(t)
})
</script>

<style lang="scss" scoped>
.orders {
  display: grid;
  gap: $sp-4;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $sp-3;
  }

  &__title {
    font-size: $fs-2xl;
  }

  &__error {
    color: $c-danger;
  }
}

.filters {
  display: grid;
  gap: $sp-3;

  @include up($bp-md) {
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  &__search {
    @include up($bp-md) {
      grid-column: 1 / -1;
    }
  }

  &__chips {
    display: flex;
    gap: $sp-2;
    overflow-x: auto;
    scrollbar-width: none;
  }
}

.chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: $sp-2;
  min-height: $tap-sm;
  padding: 0 $sp-4;
  border: $border-strong solid $c-line;
  border-radius: $r-pill;
  background: $c-surface;
  font-weight: $fw-semibold;
  font-size: $fs-sm;

  &[aria-pressed='true'] {
    border-color: $c-accent;
    background: $c-accent-soft;
  }

  &__count {
    min-width: 22px;
    padding: 0 $sp-1;
    border-radius: $r-pill;
    background: $c-surface-2;
    font-size: $fs-xs;
    text-align: center;
  }
}

.list {
  display: grid;
  gap: $sp-2;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  gap: $sp-1;
  padding: $sp-4;
  border: $border solid $c-line;
  border-radius: $r-md;
  background: $c-surface;
  text-decoration: none;

  &:hover {
    border-color: $c-accent;
  }

  &__top,
  &__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $sp-3;
  }

  &__date,
  &__when {
    font-size: $fs-sm;
    color: $c-ink-3;
  }

  &__name {
    font-weight: $fw-bold;
    font-size: $fs-lg;
  }

  &__phone {
    margin-left: $sp-2;
    font-weight: $fw-regular;
    font-size: $fs-sm;
    color: $c-ink-2;
  }

  &__meta {
    font-size: $fs-sm;
    color: $c-ink-2;
  }

  &__price {
    font-weight: $fw-bold;
    white-space: nowrap;
  }
}
</style>
