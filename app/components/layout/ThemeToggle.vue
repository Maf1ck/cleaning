<template lang="pug">
button.theme-toggle(type="button" :aria-label="`${THEME_LABELS[theme]}. Змінити тему`" :title="THEME_LABELS[theme]" @click="cycle")
  svg(v-if="theme === 'light'" viewBox="0 0 24 24" aria-hidden="true")
    circle(cx="12" cy="12" r="4.5")
    path(d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8")
  svg(v-else-if="theme === 'dark'" viewBox="0 0 24 24" aria-hidden="true")
    path(d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z")
  svg(v-else viewBox="0 0 24 24" aria-hidden="true")
    rect(x="3" y="4" width="18" height="13" rx="2")
    path(d="M8 21h8M12 17v4")
</template>

<script setup lang="ts">
const { theme, cycle } = useTheme()
</script>

<style lang="scss" scoped>
.theme-toggle {
  display: grid;
  place-items: center;
  width: $tap;
  height: $tap;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: $c-ink;

  &:hover {
    background: $c-surface-2;
  }

  svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}
</style>
