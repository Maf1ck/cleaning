<template lang="pug">
svg.logo-mark(viewBox="0 0 512 512" aria-hidden="true" focusable="false")
  rect(width="512" height="512" rx="128" class="logo-mark__tile")
  path(d="M256 92c62 73 122 139 122 208a122 122 0 0 1-244 0c0-69 60-135 122-208Z" class="logo-mark__drop")
  path(d="M205 312c6 31 27 52 58 56" class="logo-mark__shine")
  path(d="M392 84l12 32 32 12-32 12-12 32-12-32-32-12 32-12Z" class="logo-mark__spark")
</template>

<style lang="scss" scoped>
.logo-mark {
  flex: none;
  width: 34px;
  height: 34px;

  &__tile {
    fill: $c-accent;
  }

  &__drop {
    fill: $c-accent-ink;
  }

  &__shine {
    fill: none;
    stroke: $c-accent;
    stroke-width: 24;
    stroke-linecap: round;
  }

  &__spark {
    fill: $c-sun;
  }
}
</style>
