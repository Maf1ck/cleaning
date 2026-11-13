<template lang="pug">
footer.footer#contacts
  .container.footer__inner
    .footer__brand
      .footer__logo
        LogoMark
        span {{ company.name }}
      p.muted {{ company.tagline }}
      p.footer__area
        strong {{ company.city }}.
        |  {{ company.serviceArea }}
      p.footer__hours(v-if="company.workHours") {{ company.workHours }}
    .footer__contacts
      h2.footer__title Звʼязатися
      ContactButtons
    nav.footer__links(aria-label="Документи")
      NuxtLink(to="/calculator") Розрахувати вартість
      NuxtLink(to="/privacy") Політика конфіденційності
      NuxtLink(to="/credits") Атрибуція й ліцензії
      NuxtLink(to="/admin") Кабінет власника
  .container.footer__legal
    span © {{ year }} {{ company.legalName || company.name }}
    span Онлайн-оплати немає: ціну погоджуємо після розмови.
</template>

<script setup lang="ts">
const settings = useSettings()
const company = computed(() => settings.value.company)
const year = new Date().getFullYear()
</script>

<style lang="scss" scoped>
.footer {
  margin-top: $sp-9;
  padding: $sp-7 0 $sp-5;
  background: $c-surface;
  border-top: $border solid $c-line;

  &__inner {
    display: grid;
    gap: $sp-6;

    @include up($bp-md) {
      grid-template-columns: 1.2fr 1.4fr 1fr;
    }
  }

  &__brand {
    display: grid;
    gap: $sp-2;
    align-content: start;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: $sp-2;
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-lg;
  }

  &__area,
  &__hours {
    font-size: $fs-sm;
    color: $c-ink-2;
  }

  &__title {
    margin-bottom: $sp-3;
    font-size: $fs-lg;
  }

  &__links {
    display: grid;
    gap: $sp-1;
    align-content: start;

    a {
      display: inline-flex;
      align-items: center;
      min-height: $tap-sm;
      color: $c-ink-2;
      text-decoration: none;

      &:hover {
        color: $c-ink;
        text-decoration: underline;
      }
    }
  }

  &__legal {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: $sp-2;
    margin-top: $sp-6;
    padding-top: $sp-4;
    border-top: $border solid $c-line;
    font-size: $fs-xs;
    color: $c-ink-3;
  }
}
</style>
