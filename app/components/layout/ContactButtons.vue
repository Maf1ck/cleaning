<template lang="pug">
.contacts
  template(v-if="channels.length")
    a.contacts__item(
      v-for="ch in channels"
      :key="ch.id"
      :href="ch.href"
      :target="ch.href.startsWith('https:') ? '_blank' : undefined"
      :rel="ch.href.startsWith('https:') ? 'noopener noreferrer' : undefined"
    )
      span.contacts__label {{ ch.label }}
      span.contacts__value {{ ch.value }}
  p.contacts__empty(v-else role="note")
    | Контакти компанії ще не налаштовані власником.
    template(v-if="showFallback")
      |  Залиште заявку — ми зателефонуємо на ваш номер.
</template>

<script setup lang="ts">
withDefaults(defineProps<{ showFallback?: boolean }>(), { showFallback: true })
const channels = useContacts()
</script>

<style lang="scss" scoped>
.contacts {
  display: flex;
  flex-wrap: wrap;
  gap: $sp-2;

  &__item {
    display: grid;
    gap: 2px;
    min-height: $tap;
    padding: $sp-2 $sp-4;
    border: $border solid $c-line;
    border-radius: $r-md;
    background: $c-surface;
    text-decoration: none;
    transition: border-color $dur-fast $ease-out;

    &:hover {
      border-color: $c-accent;
    }
  }

  &__label {
    font-size: $fs-xs;
    color: $c-ink-3;
    font-weight: $fw-semibold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__value {
    font-weight: $fw-semibold;
  }

  &__empty {
    padding: $sp-3 $sp-4;
    border-radius: $r-md;
    background: $c-sun-soft;
    color: $c-ink;
    font-size: $fs-sm;
  }
}
</style>
