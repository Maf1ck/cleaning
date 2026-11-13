<template lang="pug">
header.header
  .container.header__inner
    NuxtLink.header__brand(to="/" aria-label="На головну")
      LogoMark
      span.header__name {{ company.name }}
    nav.header__nav(aria-label="Головне меню")
      NuxtLink.header__link(to="/#services") Послуги
      NuxtLink.header__link(to="/calculator") Розрахунок
      NuxtLink.header__link(to="/#contacts") Контакти
    .header__actions
      ThemeToggle
      NuxtLink.header__cart(to="/cart" :aria-label="cartLabel")
        svg(viewBox="0 0 24 24" aria-hidden="true")
          path(d="M5 7h14l-1.2 10.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 7Z")
          path(d="M9 7a3 3 0 0 1 6 0")
        span.header__badge(v-if="cart.ready && cart.count > 0" aria-hidden="true") {{ cart.count }}
      AppButton.header__cta(to="/calculator" size="sm") Розрахувати
</template>

<script setup lang="ts">
const settings = useSettings()
const company = computed(() => settings.value.company)
const cart = useCartStore()

const cartLabel = computed(() => (cart.ready && cart.count > 0 ? `Кошик, позицій: ${cart.count}` : 'Кошик'))
</script>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  z-index: $z-header;
  background: color-mix(in srgb, var(--c-bg) 86%, transparent);
  backdrop-filter: saturate(1.4) blur(14px);
  border-bottom: $border solid color-mix(in srgb, var(--c-line) 60%, transparent);

  &__inner {
    display: flex;
    align-items: center;
    gap: $sp-4;
    height: $header-h;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: $sp-2;
    min-height: $tap;
    text-decoration: none;
    margin-right: auto;
  }

  &__name {
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-lg;
    letter-spacing: -0.02em;
  }

  &__nav {
    display: none;
    gap: $sp-1;

    @include up($bp-md) {
      display: flex;
    }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    min-height: $tap-sm;
    padding: 0 $sp-3;
    border-radius: $r-pill;
    color: $c-ink-2;
    font-weight: $fw-medium;
    text-decoration: none;

    &:hover {
      color: $c-ink;
      background: $c-surface-2;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $sp-1;
  }

  &__cart {
    position: relative;
    display: grid;
    place-items: center;
    width: $tap;
    height: $tap;
    border-radius: 50%;
    color: $c-ink;

    &:hover {
      background: $c-surface-2;
    }

    svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linejoin: round;
    }
  }

  &__badge {
    position: absolute;
    top: 4px;
    right: 2px;
    display: grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding: 0 $sp-1;
    border-radius: $r-pill;
    background: $c-accent;
    color: $c-accent-ink;
    font-size: $fs-xs;
    font-weight: $fw-bold;
  }

  &__cta {
    display: none;

    @include up($bp-sm) {
      display: inline-flex;
      margin-left: $sp-2;
    }
  }
}
</style>
