<template lang="pug">
.layout
  a.skip-link(href="#main") Перейти до вмісту
  SiteHeader
  #main.layout__main(tabindex="-1")
    slot
  SiteFooter
  ToastHost
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__main {
    flex: 1;
    outline: none;
  }
}
</style>
