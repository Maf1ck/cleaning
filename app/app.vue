<template lang="pug">
NuxtLayout
  NuxtPage
</template>

<script setup lang="ts">
const settings = useSettings()
const { theme, sync } = useTheme()

await callOnce('settings', refreshSettings)

useHead({
  htmlAttrs: {
    'data-theme': theme,
    'data-accent': computed(() => settings.value.company.accent),
  },
  titleTemplate: (title) => (title ? `${title} · ${settings.value.company.name}` : settings.value.company.name),
})

onMounted(() => {
  sync()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sync)
})
</script>
