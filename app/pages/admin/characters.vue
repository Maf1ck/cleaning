<template lang="pug">
form.settings-page(@submit.prevent="save")
  header
    h1.settings-page__title Персонажі
    p.muted Пʼять 3D-героїв супроводжують вибір послуги. Характер змінює репліки й жвавість анімації.

  section.panel
    h2.panel__title Характер
    SegmentedControl(v-model="form.personality" legend="Підготовлений характер" :options="personalityOptions")
    p.field__hint {{ PERSONALITY_HINTS[form.personality] }}
    ToggleSwitch(v-model="form.faces" label="Показувати обличчя" hint="Вимкніть, якщо бренду потрібна стримана подача")
    ToggleSwitch(v-model="form.phrases" label="Показувати репліки" hint="Бульбашка з фразою біля персонажа")

  section.panel
    h2.panel__title Попередній перегляд
    .cast
      button.cast__chip(v-for="c in CHARACTER_LIST" :key="c.id" type="button" :aria-pressed="preview === c.id" @click="preview = c.id") {{ c.name }}
    .preview
      CharacterPoster(:id="preview" :faces="form.faces")
    ul.lines(v-if="form.phrases")
      li(v-for="line in CHARACTERS[preview].lines[form.personality]" :key="line") «{{ line }}»
    p.field__hint Нові моделі, імена й репліки додаються в коді: app/three/characters.ts і shared/content/characters.ts.

  SaveBar(:dirty="dirty" :saving="saving" :error="error" @reset="reset")
</template>

<script setup lang="ts">
import type { Personality } from '#shared/types'
import type { CharacterId } from '#shared/content/services'
import { CHARACTERS } from '#shared/content/characters'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Персонажі' })

const { form, saving, error, dirty, save, reset } = useSettingsForm('characters')
const preview = ref<CharacterId>('vacuum')
const CHARACTER_LIST = Object.values(CHARACTERS)

const personalityOptions: { value: Personality; label: string }[] = [
  { value: 'friendly', label: 'Привітний' },
  { value: 'calm', label: 'Спокійний' },
  { value: 'playful', label: 'Грайливий' },
]

const PERSONALITY_HINTS: Record<Personality, string> = {
  friendly: 'Теплі пояснювальні фрази, помірна анімація.',
  calm: 'Короткі нейтральні фрази, мінімум руху — для ділового стилю.',
  playful: 'Жарти й звуки, жвавіша анімація.',
}
</script>

<style lang="scss" scoped>
.cast {
  display: flex;
  flex-wrap: wrap;
  gap: $sp-2;

  &__chip {
    min-height: $tap-sm;
    padding: 0 $sp-4;
    border: $border-strong solid $c-line;
    border-radius: $r-pill;
    background: $c-bg;
    font-weight: $fw-semibold;

    &[aria-pressed='true'] {
      border-color: $c-accent;
      background: $c-accent-soft;
    }
  }
}

.preview {
  width: 180px;
  height: 180px;
}

.lines {
  display: grid;
  gap: $sp-1;
  margin: 0;
  padding-left: $sp-5;
  color: $c-ink-2;
}
</style>
