<template lang="pug">
article.service(:class="{ 'is-active': active }" @mouseenter="emit('focus')" @focusin="emit('focus')")
  header.service__head
    h3.service__title {{ service.title }}
    span.service__rate {{ rate }}
  p.service__lead {{ service.lead }}
  .service__lists
    div
      h4.service__subtitle Входить
      ul.service__list.service__list--yes
        li(v-for="x in service.includes" :key="x") {{ x }}
    div
      h4.service__subtitle Не входить
      ul.service__list.service__list--no
        li(v-for="x in service.excludes" :key="x") {{ x }}
  AppButton.service__cta(:to="`/calculator?type=${service.type}`" variant="soft" block) Обрати «{{ service.title }}»
</template>

<script setup lang="ts">
import type { ServiceInfo } from '#shared/content/services'
import { rateLabel } from '#shared/pricing'

const props = withDefaults(defineProps<{ service: ServiceInfo; active?: boolean }>(), { active: false })
const emit = defineEmits<{ focus: [] }>()
const settings = useSettings()
const rate = computed(() => rateLabel(props.service.type, settings.value.prices))
</script>

<style lang="scss" scoped>
.service {
  display: flex;
  flex-direction: column;
  gap: $sp-3;
  padding: $sp-5;
  border: $border solid $c-line;
  border-radius: $r-lg;
  background: $c-surface;
  transition:
    border-color $dur-base $ease-out,
    transform $dur-base $ease-out,
    box-shadow $dur-base $ease-out;

  &:hover,
  &.is-active {
    border-color: $c-accent;
    box-shadow: $shadow-1;
  }

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $sp-3;
  }

  &__title {
    font-size: $fs-xl;
  }

  &__rate {
    flex: none;
    padding: $sp-1 $sp-3;
    border-radius: $r-pill;
    background: $c-accent-soft;
    font-weight: $fw-bold;
    font-size: $fs-sm;
    white-space: nowrap;
  }

  &__lead {
    color: $c-ink-2;
  }

  &__lists {
    display: grid;
    gap: $sp-3;
  }

  &__subtitle {
    margin-bottom: $sp-1;
    font-family: $font-body;
    font-size: $fs-xs;
    font-weight: $fw-bold;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $c-ink-3;
  }

  &__list {
    display: grid;
    gap: $sp-1;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: $fs-sm;

    li {
      position: relative;
      padding-left: $sp-5;
    }

    li::before {
      position: absolute;
      left: 0;
      top: 0;
      font-weight: $fw-bold;
    }

    &--yes li::before {
      content: '✓';
      color: $c-accent;
    }

    &--no li {
      color: $c-ink-2;
    }

    &--no li::before {
      content: '–';
      color: $c-ink-3;
    }
  }

  &__cta {
    margin-top: auto;
  }
}
</style>
