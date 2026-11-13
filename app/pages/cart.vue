<template lang="pug">
.cart.container
  header.cart__head
    p.eyebrow Кошик
    h1.cart__title Ваше замовлення

  .cart__loading(v-if="!cart.ready" aria-busy="true") Завантажуємо кошик…

  .empty(v-else-if="cart.items.length === 0")
    .empty__art
      CharacterPoster(id="sponge")
    h2.empty__title Тут поки порожньо
    p.muted Оберіть тип прибирання й параметри — ціну побачите одразу.
    AppButton(to="/calculator" size="lg") Розрахувати вартість

  .cart__layout(v-else)
    ul.cart__list
      li.item(v-for="item in cart.items" :key="item.id")
        .item__main
          h2.item__title {{ describeItem(item.config).title }}
          p.item__params {{ describeItem(item.config).params.join(' · ') }}
          p.item__extras(v-if="describeItem(item.config).extras.length") + {{ describeItem(item.config).extras.join(', ') }}
        .item__side
          .item__price
            template(v-if="rowFor(item.id)?.estimate.manual") за фото
            template(v-else) {{ formatUah(rowFor(item.id)?.estimate.total ?? 0) }}
          NumberStepper.item__qty(
            compact
            :model-value="item.qty"
            :min="LIMITS.qty.min"
            :max="LIMITS.qty.max"
            :label="`Кількість: ${describeItem(item.config).title}`"
            hint=" "
            @update:model-value="cart.setQty(item.id, $event)"
          )
        .item__actions
          AppButton(:to="`/calculator?edit=${item.id}`" variant="ghost" size="sm") Змінити
          AppButton(variant="ghost" size="sm" @click="remove(item.id)") Видалити
      li.cart__more
        AppButton(to="/calculator" variant="secondary" block) + Додати ще послугу

    aside.cart__summary
      h2.cart__summary-title Підсумок
      OrderTotals(:estimate="estimate" :min-order="prices.minOrder")
      p.cart__travel(v-if="prices.outOfCityFee > 0") Виїзд за місто (+{{ formatUah(prices.outOfCityFee) }}) вкажете на наступному кроці.
      AppButton(to="/checkout" size="lg" block) Оформити заявку
</template>

<script setup lang="ts">
import { LIMITS } from '#shared/limits'
import { formatUah } from '#shared/pricing'
import { describeItem } from '~/composables/useItemSummary'

const cart = useCartStore()
const draft = useDraftStore()
const settings = useSettings()
const prices = computed(() => settings.value.prices)
const { show } = useToast()

const estimate = computed(() => cart.estimate(draft.draft.outOfCity))

function rowFor(id: string) {
  return estimate.value.items.find((r) => r.id === id)
}

function remove(id: string): void {
  const removed = cart.remove(id)
  if (!removed) return
  show(`«${describeItem(removed.item.config).title}» видалено`, {
    action: { label: 'Скасувати', run: () => cart.undoRemove(removed) },
  })
}

usePageSeo({ title: 'Кошик', description: 'Ваше замовлення прибирання.', path: '/cart', noindex: true })
</script>

<style lang="scss" scoped>
.cart {
  padding-top: $sp-5;

  &__head {
    display: grid;
    gap: $sp-2;
    margin-bottom: $sp-5;
  }

  &__title {
    font-size: $fs-3xl;
  }

  &__loading {
    color: $c-ink-3;
  }

  &__layout {
    display: grid;
    gap: $sp-5;

    @include up($bp-lg) {
      grid-template-columns: 1.5fr 1fr;
      align-items: start;
    }
  }

  &__list {
    display: grid;
    gap: $sp-3;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__summary {
    display: grid;
    gap: $sp-4;
    padding: $sp-5;
    border-radius: $r-lg;
    background: $c-surface;
    border: $border solid $c-accent;

    @include up($bp-lg) {
      position: sticky;
      top: calc(#{$header-h} + #{$sp-4});
    }
  }

  &__summary-title {
    font-size: $fs-xl;
  }

  &__travel {
    font-size: $fs-xs;
    color: $c-ink-3;
  }
}

.item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: $sp-3;
  padding: $sp-4 $sp-5;
  border-radius: $r-lg;
  background: $c-surface;
  border: $border solid $c-line;

  &__main {
    display: grid;
    gap: $sp-1;
  }

  &__title {
    font-size: $fs-lg;
  }

  &__params,
  &__extras {
    font-size: $fs-sm;
    color: $c-ink-2;
  }

  &__side {
    display: grid;
    justify-items: end;
    gap: $sp-2;

    :deep(.stepper__label),
    :deep(.stepper__hint) {
      @include visually-hidden;
    }
  }

  &__price {
    font-weight: $fw-bold;
    font-size: $fs-lg;
    white-space: nowrap;
  }

  &__actions {
    grid-column: 1 / -1;
    display: flex;
    gap: $sp-2;
    margin-left: -$sp-3;
  }
}

.empty {
  display: grid;
  justify-items: center;
  gap: $sp-3;
  max-width: 460px;
  margin: $sp-6 auto;
  text-align: center;

  &__art {
    width: 180px;
    height: 180px;
  }

  &__title {
    font-size: $fs-2xl;
  }
}
</style>
