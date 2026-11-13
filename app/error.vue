<template lang="pug">
NuxtLayout
  .err.container
    p.eyebrow Помилка {{ error.statusCode }}
    h1.err__title {{ error.statusCode === 404 ? 'Такої сторінки немає' : 'Щось пішло не так' }}
    p.muted {{ error.statusCode === 404 ? 'Можливо, посилання застаріло.' : 'Спробуйте оновити сторінку трохи пізніше.' }}
    .err__actions
      AppButton(@click="handleError") На головну
      AppButton(to="/calculator" variant="secondary") Розрахувати вартість
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

function handleError(): void {
  void clearError({ redirect: '/' })
}
</script>

<style lang="scss" scoped>
.err {
  display: grid;
  gap: $sp-3;
  padding-top: $sp-8;
  padding-bottom: $sp-8;

  &__title {
    font-size: $fs-3xl;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $sp-2;
  }
}
</style>
