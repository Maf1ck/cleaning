<template lang="pug">
.login
  form.login__card(@submit.prevent="submit" novalidate)
    .login__brand
      LogoMark
      span {{ company.name }}
    h1.login__title Кабінет власника
    p.muted(v-if="!state.checked") Перевіряємо сеанс…
    template(v-else)
      p.login__warn(v-if="!state.configured" role="alert")
        | Пароль власника ще не налаштовано. Задайте змінну середовища NUXT_ADMIN_PASSWORD (мінімум 10 символів) і перезапустіть сервер.
      label.field
        span.field__label Пароль
        input.field__input(
          ref="input"
          v-model="password"
          type="password"
          autocomplete="current-password"
          :aria-invalid="Boolean(error)"
          aria-describedby="login-error"
          :disabled="!state.configured"
        )
        span#login-error.field__error(v-if="error" role="alert") {{ error }}
      AppButton(type="submit" size="lg" block :loading="loading" :disabled="!state.configured") Увійти
    NuxtLink.login__back(to="/") ← На сайт
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useSeoMeta({ title: 'Вхід у кабінет', robots: 'noindex, nofollow' })

const settings = useSettings()
const company = computed(() => settings.value.company)
const { state, check } = useAdminAuth()
const password = ref('')
const error = ref('')
const loading = ref(false)
const input = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  if (await check()) await navigateTo('/admin/orders')
  else void nextTick(() => input.value?.focus())
})

async function submit(): Promise<void> {
  if (!password.value) {
    error.value = 'Введіть пароль'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    password.value = ''
    await check()
    await navigateTo('/admin/orders')
  } catch (e) {
    error.value = adminErrorMessage(e, 'Не вдалося увійти')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: $sp-4;

  &__card {
    display: grid;
    gap: $sp-4;
    width: min(400px, 100%);
    padding: $sp-6 $sp-5;
    border-radius: $r-lg;
    background: $c-surface;
    border: $border solid $c-line;
    box-shadow: $shadow-1;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: $sp-2;
    font-family: $font-display;
    font-weight: $fw-semibold;
  }

  &__title {
    font-size: $fs-2xl;
  }

  &__warn {
    padding: $sp-3;
    border-radius: $r-md;
    background: $c-sun-soft;
    font-size: $fs-sm;
  }

  &__back {
    justify-self: center;
    color: $c-ink-2;
    font-size: $fs-sm;
  }
}
</style>
