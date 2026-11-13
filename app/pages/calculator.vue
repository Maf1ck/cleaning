<template lang="pug">
.calc.container
  header.calc__head
    p.eyebrow {{ editing ? 'Редагування позиції' : 'Розрахунок' }}
    h1.calc__title {{ editing ? 'Змініть параметри' : 'Скільки коштуватиме прибирання' }}
  .calc__layout
    aside.calc__visual
      .calc__stage
        CharacterStage(:active="character" compact)
      p.calc__note
        | {{ CHARACTERS[character].name }} показує тип прибирання. Площа, кімнати й додаткові послуги
        | змінюють розрахунок, а не саму 3D-сцену.

    form.calc__form(@submit.prevent="submit" novalidate)
      section.block
        h2.block__title 1. Тип прибирання
        ServiceTypePicker(v-model="config.type")

      section.block
        h2.block__title 2. Приміщення
        template(v-if="isArea")
          .block__grid
            NumberStepper(v-model="config.area" :min="LIMITS.area.min" :max="LIMITS.area.max" :step="LIMITS.area.step" label="Площа" unit="м²")
            NumberStepper(v-model="config.rooms" :min="LIMITS.rooms.min" :max="LIMITS.rooms.max" label="Кімнат" hint="для бригади, на ціну не впливає")
            NumberStepper(v-model="config.bathrooms" :min="LIMITS.bathrooms.min" :max="LIMITS.bathrooms.max" label="Санвузлів" :hint="bathroomHint")
        template(v-else-if="config.type === 'windows'")
          .block__grid
            NumberStepper(v-model="config.sashes" :min="LIMITS.sashes.min" :max="LIMITS.sashes.max" label="Стулок" hint="кожна стулка, що відчиняється або глуха")
          ToggleSwitch(v-model="config.balcony" label="Є балкон або лоджія" :hint="`+${formatUah(prices.windows.balcony)} за скління балкона`")
        template(v-else)
          label.field
            span.field__label Опишіть задачу
            textarea.field__input(
              v-model="config.description"
              rows="4"
              :maxlength="LIMITS.description.max"
              placeholder="Наприклад: помити терасу після зими, близько 20 м², є садові меблі"
              :aria-invalid="Boolean(descriptionError)"
              aria-describedby="desc-hint"
            )
            span#desc-hint.field__hint(:class="{ 'is-error': descriptionError }") {{ descriptionError || 'Фото додасте на кроці оформлення — щонайменше одне.' }}

      section.block(v-if="config.type !== 'other'")
        h2.block__title 3. Додаткові послуги
        ExtrasPicker(v-model="config.extras")

      section.block(v-if="config.type !== 'other'")
        h2.block__title 4. Регулярність і стан
        SegmentedControl(v-model="config.frequency" legend="Як часто прибирати" :options="frequencyOptions")
        ToggleSwitch(v-model="config.heavyDirt" label="Сильне забруднення" :hint="`+${prices.heavyDirtPct}% — давно не прибирали, тварини, жир на кухні`")

      section.block.block--summary(aria-live="polite")
        h2.block__title Орієнтовна вартість
        PriceLines(:estimate="estimate")
        p.block__fine
          | Мінімальне замовлення — {{ formatUah(prices.minOrder) }} (враховуємо в кошику).
          | Підсумкову ціну погоджуємо телефоном.
        .block__actions
          AppButton(type="submit" size="lg" block) {{ editing ? 'Зберегти зміни' : 'Додати в кошик' }}
          AppButton(v-if="editing" to="/cart" variant="ghost" block) Скасувати

  Transition(name="added")
    .added(v-if="added" role="status")
      p.added__text
        strong {{ added.merged ? 'Така позиція вже є — збільшили кількість.' : 'Додано в кошик.' }}
        |  Можна додати ще послугу, наприклад вікна.
      .added__actions
        AppButton(to="/cart") До кошика ({{ cart.count }})
        AppButton(variant="secondary" @click="addAnother") Додати ще послугу

  .calc__bar(v-if="!added")
    .calc__bar-price
      span.calc__bar-label Орієнтовно
      strong {{ estimate.manual ? 'за фото' : formatUah(estimate.unit ?? 0) }}
    AppButton(@click="submit") {{ editing ? 'Зберегти' : 'У кошик' }}
</template>

<script setup lang="ts">
import { CLEANING_TYPES, FREQUENCIES } from '#shared/types'
import type { CleaningType, Frequency, ItemConfig } from '#shared/types'
import { FREQUENCY_LABELS, SERVICE_BY_TYPE } from '#shared/content/services'
import { CHARACTERS } from '#shared/content/characters'
import { LIMITS, defaultConfig } from '#shared/limits'
import { estimateItem, formatUah, isAreaType } from '#shared/pricing'

const route = useRoute()
const router = useRouter()
const settings = useSettings()
const prices = computed(() => settings.value.prices)
const cart = useCartStore()
const { show } = useToast()

function typeFromQuery(): CleaningType {
  const t = String(route.query.type ?? '')
  return (CLEANING_TYPES as readonly string[]).includes(t) ? (t as CleaningType) : 'maintenance'
}

const editId = computed(() => (typeof route.query.edit === 'string' ? route.query.edit : ''))
const editing = computed(() => Boolean(editId.value && cart.byId(editId.value)))
const config = reactive<ItemConfig>(defaultConfig(typeFromQuery()))
const added = ref<{ merged: boolean } | null>(null)
const descriptionError = ref('')

function loadEditItem(): void {
  const item = editId.value ? cart.byId(editId.value) : undefined
  if (item) Object.assign(config, structuredClone(toRaw(item.config)), { extras: { ...item.config.extras } })
}

// The cart is restored after hydration; load the edited line once it is available.
watch(
  () => cart.ready,
  (ready) => {
    if (ready) loadEditItem()
  },
  { immediate: true },
)

watch(
  () => route.query.type,
  () => {
    if (!editing.value) config.type = typeFromQuery()
  },
)

watch(
  () => config.type,
  (type) => {
    descriptionError.value = ''
    if (!editing.value && route.query.type !== type) void router.replace({ query: { ...route.query, type } })
  },
)

watch(
  () => config.description,
  () => {
    if (descriptionError.value && config.description.trim().length >= 5) descriptionError.value = ''
  },
)

const isArea = computed(() => isAreaType(config.type))
const character = computed(() => SERVICE_BY_TYPE[config.type].character)
const estimate = computed(() => estimateItem(config, prices.value))
const bathroomHint = computed(() => (prices.value.bathroomExtra > 0 ? `кожен понад перший +${formatUah(prices.value.bathroomExtra)}` : 'для бригади'))

const frequencyOptions = computed(() =>
  FREQUENCIES.map((f: Frequency) => ({
    value: f,
    label: FREQUENCY_LABELS[f],
    badge: f === 'once' ? undefined : `−${prices.value.regularDiscountPct[f]}%`,
  })),
)

function submit(): void {
  if (config.type === 'other' && config.description.trim().length < 5) {
    descriptionError.value = 'Опишіть задачу хоча б кількома словами'
    return
  }
  const snapshot: ItemConfig = structuredClone(toRaw(config))
  if (editing.value) {
    const res = cart.update(editId.value, snapshot)
    show(res.merged ? 'Позиції однакові — обʼєднали в одну' : 'Зміни збережено', { tone: 'success' })
    void router.push('/cart')
    return
  }
  const res = cart.add(snapshot)
  added.value = { merged: res.merged }
}

function addAnother(): void {
  added.value = null
  const next: CleaningType = config.type === 'windows' ? 'general' : 'windows'
  Object.assign(config, defaultConfig(next))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

usePageSeo({
  title: 'Розрахунок вартості прибирання',
  description: 'Оберіть тип прибирання, площу й додаткові послуги — орієнтовна вартість рахується одразу за відкритою формулою.',
  path: '/calculator',
})
</script>

<style lang="scss" scoped>
.calc {
  padding-top: $sp-5;
  padding-bottom: 120px;

  @include up($bp-lg) {
    padding-bottom: $sp-6;
  }

  &__head {
    display: grid;
    gap: $sp-2;
    margin-bottom: $sp-5;
  }

  &__title {
    font-size: $fs-3xl;
  }

  &__layout {
    display: grid;
    gap: $sp-5;

    @include up($bp-lg) {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
      align-items: start;
      gap: $sp-6;
    }
  }

  &__visual {
    display: grid;
    gap: $sp-3;

    @include up($bp-lg) {
      position: sticky;
      top: calc(#{$header-h} + #{$sp-4});
    }
  }

  &__stage {
    height: clamp(260px, 56vw, 460px);
  }

  &__note {
    font-size: $fs-sm;
    color: $c-ink-3;
  }

  &__form {
    display: grid;
    gap: $sp-4;
  }

  &__bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: $z-sticky;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $sp-3;
    padding: $sp-3 $sp-4 calc(#{$sp-3} + env(safe-area-inset-bottom));
    background: $c-surface;
    border-top: $border solid $c-line;
    box-shadow: $shadow-2;

    @include up($bp-lg) {
      display: none;
    }
  }

  &__bar-price {
    display: grid;

    strong {
      font-family: $font-display;
      font-size: $fs-xl;
      font-weight: $fw-semibold;
    }
  }

  &__bar-label {
    font-size: $fs-xs;
    color: $c-ink-3;
  }
}

.block {
  display: grid;
  gap: $sp-4;
  padding: $sp-5;
  border-radius: $r-lg;
  background: $c-surface;
  border: $border solid $c-line;

  &__title {
    font-size: $fs-lg;
  }

  &__grid {
    display: grid;
    gap: $sp-4;

    @include up($bp-sm) {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  }

  &__fine {
    font-size: $fs-xs;
    color: $c-ink-3;
  }

  &__actions {
    display: grid;
    gap: $sp-2;
  }

  &--summary {
    border-color: $c-accent;
  }
}

.field__hint.is-error {
  color: $c-danger;
}

.added {
  position: fixed;
  left: 50%;
  bottom: calc(#{$sp-4} + env(safe-area-inset-bottom));
  z-index: $z-toast;
  display: grid;
  gap: $sp-3;
  width: min(520px, calc(100vw - #{$sp-6}));
  padding: $sp-4 $sp-5;
  border-radius: $r-lg;
  background: $c-surface;
  border: $border-strong solid $c-accent;
  box-shadow: $shadow-2;
  transform: translateX(-50%);

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $sp-2;
  }
}

.added-enter-active,
.added-leave-active {
  transition:
    opacity $dur-base $ease-out,
    transform $dur-base $ease-out;
}

.added-enter-from,
.added-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
