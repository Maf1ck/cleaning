<template lang="pug">
.settings-page
  form.settings-page(@submit.prevent="save")
    header
      h1.settings-page__title Гра
      p.muted Після відправки заявки клієнт може відмити 3D-дзеркало. Це розвага; поточне замовлення від неї не дешевшає.

    section.panel
      h2.panel__title Режим
      SegmentedControl(v-model="form.mode" legend="Що отримує клієнт" :options="modeOptions")
      p.field__hint {{ modeHint }}

    section.panel(v-if="form.mode === 'bonus'")
      h2.panel__title Бонус на наступне прибирання
      .form-grid
        NumberField(v-model="form.bonusAmount" label="Сума бонусу" :max="5000")
        NumberField(v-model="form.validDays" label="Діє" suffix="днів" :min="1" :max="365")
        NumberField(v-model="form.minNextOrder" label="Мінімум наступного замовлення")
      p.field__hint
        | Один код на заявку. Автоматичного погашення й захисту від накруток немає:
        | перевірте код у списку нижче й застосуйте знижку вручну під час погодження ціни.

    SaveBar(:dirty="dirty" :saving="saving" :error="error" @reset="reset")

  section.panel
    .bonus-head
      h2.panel__title Видані коди
      label.field
        span.visually-hidden Пошук коду
        input.field__input(v-model="q" placeholder="PR-…" @input="loadBonuses")
    p.muted(v-if="!bonuses.length") Кодів поки немає.
    ul.bonuses(v-else)
      li(v-for="b in bonuses" :key="b.code")
        div
          strong {{ b.code }}
          span.muted  {{ formatUah(b.amount) }} від {{ formatUah(b.minOrder) }} · до {{ formatShort(b.expiresAt) }}
          p.muted
            NuxtLink(:to="`/admin/orders/${b.orderId}`") {{ b.name }}
            |  · {{ BONUS_LABELS[b.status] ?? b.status }}
        .bonuses__actions(v-if="b.status === 'issued'")
          AppButton(size="sm" variant="secondary" @click="setStatus(b.code, 'redeemed')") Використано
          AppButton(size="sm" variant="ghost" @click="setStatus(b.code, 'void')") Анулювати
</template>

<script setup lang="ts">
import type { AdminBonus } from '#shared/adminTypes'
import type { GameMode } from '#shared/types'
import { formatUah } from '#shared/pricing'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Гра' })

const { form, saving, error, dirty, save, reset } = useSettingsForm('game')
const { show } = useToast()
const BONUS_LABELS: Record<string, string> = { issued: 'видано', redeemed: 'використано', void: 'анульовано' }

const modeOptions: { value: GameMode; label: string }[] = [
  { value: 'off', label: 'Вимкнено' },
  { value: 'play', label: 'Без знижки' },
  { value: 'bonus', label: 'Бонус' },
]

const modeHint = computed(() => {
  if (form.value.mode === 'off') return 'Гру на сторінці заявки не показуємо.'
  if (form.value.mode === 'play') return 'Гра доступна, бонусів немає.'
  return 'Після гри клієнт отримує код на знижку для наступного прибирання.'
})

const q = ref('')
const bonuses = ref<AdminBonus[]>([])

async function loadBonuses(): Promise<void> {
  try {
    bonuses.value = await adminFetch<AdminBonus[]>('/api/admin/bonuses', { query: { q: q.value } })
  } catch (e) {
    show(adminErrorMessage(e), { tone: 'error' })
  }
}

async function setStatus(code: string, status: 'redeemed' | 'void'): Promise<void> {
  try {
    await adminFetch(`/api/admin/bonuses/${code}`, { method: 'PATCH', body: { status } })
    await loadBonuses()
  } catch (e) {
    show(adminErrorMessage(e), { tone: 'error' })
  }
}

onMounted(loadBonuses)
</script>

<style lang="scss" scoped>
.bonus-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $sp-3;
}

.bonuses {
  display: grid;
  gap: $sp-2;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $sp-3;
    padding: $sp-3 0;
    border-bottom: $border solid $c-line;
  }

  &__actions {
    display: flex;
    gap: $sp-2;
  }
}
</style>
