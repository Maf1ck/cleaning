<template lang="pug">
.settings-page
  header
    h1.settings-page__title Доступ
    p.muted Після зміни пароля всі інші сеанси (інші пристрої й браузери) закриваються.

  form.panel(@submit.prevent="change" novalidate)
    h2.panel__title Змінити пароль
    .form-grid
      label.field
        span.field__label Поточний пароль
        input.field__input(v-model="current" type="password" autocomplete="current-password")
      label.field
        span.field__label Новий пароль
        input.field__input(v-model="next" type="password" autocomplete="new-password" minlength="10" aria-describedby="pw-hint")
        span#pw-hint.field__hint Щонайменше 10 символів
      label.field
        span.field__label Повторіть новий
        input.field__input(v-model="repeat" type="password" autocomplete="new-password")
    p.field__error(v-if="error" role="alert") {{ error }}
    AppButton(type="submit" :loading="saving") Змінити пароль

  section.panel
    h2.panel__title Вихід
    p.muted Закрити сеанс на цьому пристрої.
    AppButton(variant="secondary" @click="logout") Вийти з кабінету
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Доступ' })

const { logout } = useAdminAuth()
const { show } = useToast()
const current = ref('')
const next = ref('')
const repeat = ref('')
const error = ref('')
const saving = ref(false)

async function change(): Promise<void> {
  error.value = ''
  if (next.value.length < 10) {
    error.value = 'Новий пароль — щонайменше 10 символів'
    return
  }
  if (next.value !== repeat.value) {
    error.value = 'Паролі не збігаються'
    return
  }
  saving.value = true
  try {
    await adminFetch('/api/admin/password', { method: 'POST', body: { current: current.value, next: next.value } })
    current.value = next.value = repeat.value = ''
    show('Пароль змінено. Інші сеанси закрито.', { tone: 'success' })
  } catch (e) {
    error.value = adminErrorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>
