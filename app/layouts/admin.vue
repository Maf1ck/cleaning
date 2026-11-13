<template lang="pug">
.admin
  header.admin__bar
    .admin__inner
      NuxtLink.admin__brand(to="/admin/orders")
        LogoMark
        span {{ company.name }}
        span.admin__tag Кабінет
      .admin__right
        ThemeToggle
        NuxtLink.admin__site(to="/" target="_blank") Сайт ↗
    nav.admin__nav(aria-label="Розділи кабінету")
      NuxtLink.admin__tab(
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        :class="{ 'is-active': route.path.startsWith(t.to) }"
        :aria-current="route.path.startsWith(t.to) ? 'page' : undefined"
      ) {{ t.label }}
  main.admin__main
    slot
  ToastHost
</template>

<script setup lang="ts">
const settings = useSettings()
const company = computed(() => settings.value.company)
const route = useRoute()

const tabs = [
  { to: '/admin/orders', label: 'Заявки' },
  { to: '/admin/tariffs', label: 'Тарифи' },
  { to: '/admin/company', label: 'Компанія' },
  { to: '/admin/game', label: 'Гра' },
  { to: '/admin/characters', label: 'Персонажі' },
  { to: '/admin/access', label: 'Доступ' },
]

useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<style lang="scss" scoped>
.admin {
  min-height: 100dvh;

  &__bar {
    position: sticky;
    top: 0;
    z-index: $z-header;
    background: $c-surface;
    border-bottom: $border solid $c-line;
  }

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $sp-3;
    max-width: $container;
    margin: 0 auto;
    padding: $sp-2 $sp-4;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: $sp-2;
    min-height: $tap;
    font-family: $font-display;
    font-weight: $fw-semibold;
    text-decoration: none;
  }

  &__tag {
    padding: 2px $sp-2;
    border-radius: $r-pill;
    background: $c-surface-2;
    font-family: $font-body;
    font-size: $fs-xs;
    color: $c-ink-2;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: $sp-2;
  }

  &__site {
    display: inline-flex;
    align-items: center;
    min-height: $tap-sm;
    padding: 0 $sp-3;
    color: $c-ink-2;
    font-size: $fs-sm;
    text-decoration: none;
  }

  &__nav {
    display: flex;
    gap: $sp-1;
    max-width: $container;
    margin: 0 auto;
    padding: 0 $sp-4 $sp-2;
    overflow-x: auto;
    scrollbar-width: none;
  }

  &__tab {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: $tap-sm;
    padding: 0 $sp-4;
    border-radius: $r-pill;
    color: $c-ink-2;
    font-weight: $fw-semibold;
    font-size: $fs-sm;
    text-decoration: none;

    &:hover {
      background: $c-surface-2;
      color: $c-ink;
    }

    &.is-active {
      background: $c-accent;
      color: $c-accent-ink;
    }
  }

  &__main {
    max-width: $container;
    margin: 0 auto;
    padding: $sp-5 $sp-4 $sp-8;
  }
}
</style>
