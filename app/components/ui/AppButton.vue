<template lang="pug">
component.btn(
  :is="tag"
  v-bind="bindings"
  :class="[`btn--${variant}`, `btn--${size}`, { 'btn--block': block, 'btn--loading': loading }]"
  :aria-busy="loading || undefined"
)
  span.btn__spinner(v-if="loading" aria-hidden="true")
  slot
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
    size?: 'sm' | 'md' | 'lg'
    to?: string
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button', disabled: false, loading: false, block: false },
)

const NuxtLink = resolveComponent('NuxtLink')

const tag = computed(() => (props.to ? NuxtLink : props.href ? 'a' : 'button'))

const bindings = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) {
    const external = /^https?:/.test(props.href)
    return { href: props.href, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }
  }
  return { type: props.type, disabled: props.disabled || props.loading }
})
</script>

<style lang="scss" scoped>
.btn {
  --btn-bg: #{$c-accent};
  --btn-ink: #{$c-accent-ink};
  --btn-line: transparent;

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $sp-2;
  min-height: $tap;
  padding: 0 $sp-5;
  border: $border-strong solid var(--btn-line);
  border-radius: $r-pill;
  background: var(--btn-bg);
  color: var(--btn-ink);
  font-weight: $fw-semibold;
  font-size: $fs-md;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  transition:
    transform $dur-fast $ease-out,
    background-color $dur-fast $ease-out,
    box-shadow $dur-fast $ease-out,
    opacity $dur-fast;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    box-shadow: $shadow-1;
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  &--secondary {
    --btn-bg: #{$c-surface};
    --btn-ink: #{$c-ink};
    --btn-line: #{$c-line};
  }

  &--soft {
    --btn-bg: #{$c-accent-soft};
    --btn-ink: #{$c-ink};
  }

  &--ghost {
    --btn-bg: transparent;
    --btn-ink: #{$c-ink};

    &:hover {
      --btn-bg: #{$c-surface-2};
      box-shadow: none;
    }
  }

  &--danger {
    --btn-bg: #{$c-danger};
    --btn-ink: #{$c-surface};
  }

  &--sm {
    min-height: $tap-sm;
    padding: 0 $sp-4;
    font-size: $fs-sm;
  }

  &--lg {
    min-height: 56px;
    padding: 0 $sp-6;
    font-size: $fs-lg;
  }

  &--block {
    display: flex;
    width: 100%;
  }

  &__spinner {
    width: 1em;
    height: 1em;
    border: $border-strong solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
