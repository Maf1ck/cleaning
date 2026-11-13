<template lang="pug">
span.badge(:class="`badge--${status}`") {{ STATUS_LABELS[status] }}
</template>

<script setup lang="ts">
import type { OrderStatus } from '#shared/types'
import { STATUS_LABELS } from '#shared/content/services'

defineProps<{ status: OrderStatus }>()
</script>

<style lang="scss" scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: $sp-1;
  padding: $sp-1 $sp-3;
  border-radius: $r-pill;
  font-size: $fs-sm;
  font-weight: $fw-bold;
  white-space: nowrap;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  &--new {
    background: $c-sun-soft;
    color: $c-ink;
  }

  &--agreed {
    background: $c-accent-soft;
    color: $c-accent;
  }

  &--done {
    background: $c-surface-2;
    color: $c-success;
  }

  &--cancelled {
    background: $c-danger-soft;
    color: $c-danger;
  }
}
</style>
