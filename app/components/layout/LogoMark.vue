<template lang="pug">
svg.logo-mark(viewBox="0 0 32 32" aria-hidden="true" focusable="false")
  path(d="M16 3c4.6 5.4 9 10.3 9 15.4A9 9 0 0 1 7 18.4C7 13.3 11.4 8.4 16 3Z" fill="currentColor")
  path(d="M12.2 19.2c.4 2.3 2 3.8 4.3 4.1" stroke="var(--c-surface)" stroke-width="2" stroke-linecap="round" fill="none")
  circle(cx="25.5" cy="7" r="2.2" fill="var(--c-sun)")
</template>

<style lang="scss" scoped>
.logo-mark {
  width: 28px;
  height: 28px;
  color: $c-accent;
}
</style>
