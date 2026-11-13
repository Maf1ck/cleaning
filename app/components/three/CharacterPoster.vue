<template lang="pug">
svg.poster(viewBox="0 0 200 200" role="img" :aria-label="`${info.name} — ${info.role}`")
  ellipse(cx="100" cy="182" rx="70" ry="9" class="poster__shadow")
  g(v-if="id === 'vacuum'")
    rect(x="44" y="88" width="104" height="86" rx="18" fill="#ee8366")
    ellipse(cx="96" cy="88" rx="52" ry="20" fill="#46524d")
    path(d="M80 70a16 12 0 0 1 32 0" stroke="#2d3532" stroke-width="7" fill="none" stroke-linecap="round")
    rect(x="40" y="160" width="112" height="12" rx="6" fill="#2d3532")
    path(d="M148 110c22-12 34 6 28 22" stroke="#46524d" stroke-width="9" fill="none" stroke-linecap="round")
    path(d="M176 132l6 44" stroke="#c9d1ce" stroke-width="5" stroke-linecap="round")
    rect(x="166" y="174" width="34" height="8" rx="4" fill="#2d3532")
  g(v-else-if="id === 'bucket'")
    path(d="M48 92h104l-12 82H60z" fill="#5ba4d9")
    ellipse(cx="100" cy="92" rx="52" ry="10" fill="#e9f4fb")
    ellipse(cx="100" cy="94" rx="46" ry="7" fill="#9fd6f2")
    path(d="M52 92c4-44 92-44 96 0" stroke="#c9d1ce" stroke-width="4" fill="none")
    path(d="M126 96l26-78" stroke="#c89b6d" stroke-width="7" stroke-linecap="round")
    path(d="M142 94c6 10 10 18 8 28M150 92c6 8 12 14 12 24" stroke="#e8e4da" stroke-width="7" fill="none" stroke-linecap="round")
  g(v-else-if="id === 'spray'")
    rect(x="62" y="78" width="76" height="98" rx="22" fill="#8fd3b5")
    rect(x="62" y="104" width="76" height="40" fill="#fbfaf6")
    rect(x="84" y="60" width="32" height="20" rx="4" fill="#2d3532")
    rect(x="74" y="36" width="70" height="26" rx="10" fill="#ee8366")
    rect(x="142" y="44" width="16" height="9" rx="3" fill="#2d3532")
    path(d="M118 62l8 24" stroke="#ee8366" stroke-width="8" stroke-linecap="round")
  g(v-else-if="id === 'squeegee'")
    rect(x="24" y="30" width="152" height="12" rx="6" fill="#c9d1ce")
    rect(x="26" y="22" width="148" height="8" rx="4" fill="#2d3532")
    rect(x="94" y="42" width="12" height="20" fill="#c9d1ce")
    rect(x="66" y="60" width="68" height="116" rx="34" fill="#f2b33d")
    rect(x="66" y="74" width="68" height="6" fill="#2d3532")
    rect(x="66" y="158" width="68" height="6" fill="#2d3532")
  g(v-else)
    rect(x="40" y="98" width="120" height="78" rx="16" fill="#f6c453")
    rect(x="40" y="80" width="120" height="22" rx="8" fill="#3e9c6e")
    circle(cx="56" cy="160" r="5" fill="#d9a52f")
    circle(cx="146" cy="116" r="6" fill="#d9a52f")
    circle(cx="150" cy="158" r="4" fill="#d9a52f")
    circle(cx="160" cy="58" r="10" class="poster__bubble")
    circle(cx="40" cy="56" r="7" class="poster__bubble")
  g(v-if="faces" :transform="faceTransform")
    ellipse(cx="-12" cy="0" rx="5" ry="6.5" fill="#1d2320")
    ellipse(cx="12" cy="0" rx="5" ry="6.5" fill="#1d2320")
    circle(cx="-10.5" cy="-2" r="1.6" fill="#fff")
    circle(cx="13.5" cy="-2" r="1.6" fill="#fff")
    circle(cx="-22" cy="10" r="5" fill="#f29c8a" opacity="0.55")
    circle(cx="22" cy="10" r="5" fill="#f29c8a" opacity="0.55")
    path(d="M-7 9q7 7 14 0" stroke="#1d2320" stroke-width="2.6" fill="none" stroke-linecap="round")
</template>

<script setup lang="ts">
import type { CharacterId } from '#shared/content/services'
import { CHARACTERS } from '#shared/content/characters'

const props = withDefaults(defineProps<{ id: CharacterId; faces?: boolean }>(), { faces: true })

const info = computed(() => CHARACTERS[props.id])

const FACE_POS: Record<CharacterId, [number, number]> = {
  vacuum: [96, 128],
  bucket: [100, 128],
  spray: [100, 124],
  squeegee: [100, 108],
  sponge: [100, 134],
}

const faceTransform = computed(() => {
  const [x, y] = FACE_POS[props.id]
  return `translate(${x} ${y})`
})
</script>

<style lang="scss" scoped>
.poster {
  width: 100%;
  height: 100%;

  &__shadow {
    fill: $c-ink;
    opacity: 0.08;
  }

  &__bubble {
    fill: $c-surface;
    stroke: $c-line;
    stroke-width: 1.5;
  }
}
</style>
