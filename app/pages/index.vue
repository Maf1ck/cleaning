<template lang="pug">
.home
  section.hero.container
    .hero__copy
      p.eyebrow {{ company.city }} · прибирання з виїздом
      h1.hero__title Приберемо, поки ви живете своє життя
      p.hero__lead
        | Квартири, будинки й невеликі офіси. Порахуйте орієнтовну вартість за хвилину —
        | остаточну ціну й час погодимо телефоном до виїзду.
      .hero__actions
        AppButton(to="/calculator" size="lg") Розрахувати вартість
        AppButton(to="/#services" size="lg" variant="secondary") Що входить
    ul.hero__facts
      li
        strong Ціна одразу
        span формула відкрита, без «від…»
      li
        strong Без передоплати
        span оплата після прибирання
      li
        strong Фото приватні
        span бачить лише власник
    .hero__visual
      .hero__stage
        CharacterStage(:active="activeCharacter")
      .hero__cast(role="group" aria-label="Обрати персонажа")
        button.hero__chip(
          v-for="s in services"
          :key="s.type"
          type="button"
          :aria-pressed="activeCharacter === s.character"
          @click="activeCharacter = s.character"
        )
          span.hero__chip-name {{ CHARACTERS[s.character].name }}
          span.hero__chip-type {{ s.title }}

  section#services.section.container(aria-labelledby="services-title")
    .section__head
      p.eyebrow Послуги
      h2#services-title.section__title Оберіть тип прибирання
      p.section__lead.muted Ціни — з налаштувань компанії. Кількість кімнат і санвузлів уточнює розрахунок.
    .services
      ServiceCard(
        v-for="s in services"
        :key="s.type"
        :service="s"
        :active="activeCharacter === s.character"
        @focus="activeCharacter = s.character"
      )

  section.section.container(aria-labelledby="how-title")
    .section__head
      p.eyebrow Як це працює
      h2#how-title.section__title Чотири кроки без сюрпризів
    ol.steps
      li.steps__item(v-for="(step, i) in steps" :key="step.title")
        span.steps__num {{ i + 1 }}
        h3.steps__title {{ step.title }}
        p.muted {{ step.text }}

  section.section.container(aria-labelledby="price-title")
    .pricing
      .pricing__copy
        p.eyebrow Чесний розрахунок
        h2#price-title.section__title Як ми рахуємо
        ol.pricing__formula
          li База: ціна за м² × площа (вікна — за стулку)
          li + додаткові послуги за фіксованою ціною
          li + {{ prices.heavyDirtPct }}% за сильне забруднення
          li − знижка за регулярність: до {{ maxDiscount }}%
          li Заокруглення до {{ prices.roundTo }} ₴
        p.muted
          | Мінімальне замовлення — {{ formatUah(prices.minOrder) }}. Виїзд за місто — +{{ formatUah(prices.outOfCityFee) }} окремо.
          | «Інше» оцінюємо за фото й ніколи не показуємо як безкоштовне.
      .pricing__extras
        h3.pricing__subtitle Додаткові послуги
        ul.extras
          li.extras__row(v-for="row in extras" :key="row.id")
            span {{ row.title }}
            span.extras__price {{ formatUah(row.price) }} / {{ row.unit }}

  section.section.container(aria-labelledby="faq-title")
    .section__head
      p.eyebrow Питання
      h2#faq-title.section__title Часті запитання
    .faq
      details.faq__item(v-for="q in faq" :key="q.q")
        summary {{ q.q }}
        p.muted {{ q.a }}

  section.section.container
    .cta
      h2.cta__title Готові до чистоти?
      p Порахуйте вартість і залиште заявку — ми зателефонуємо, щоб погодити ціну й час.
      AppButton(to="/calculator" size="lg" variant="secondary") Почати розрахунок
</template>

<script setup lang="ts">
import { EXTRA_IDS } from '#shared/types'
import type { CharacterId } from '#shared/content/services'
import { EXTRA_LABELS, SERVICES } from '#shared/content/services'
import { CHARACTERS } from '#shared/content/characters'
import { formatUah } from '#shared/pricing'

const settings = useSettings()
const company = computed(() => settings.value.company)
const prices = computed(() => settings.value.prices)
const services = SERVICES
const activeCharacter = ref<CharacterId>('vacuum')

const maxDiscount = computed(() => Math.max(...Object.values(prices.value.regularDiscountPct)))
const extras = computed(() => EXTRA_IDS.map((id) => ({ id, ...EXTRA_LABELS[id], price: prices.value.extras[id] })))

const steps = [
  { title: 'Розрахунок', text: 'Оберіть тип, площу й додаткові послуги — ціна оновлюється одразу.' },
  { title: 'Заявка', text: 'Залиште контакти, бажаний час і, за потреби, фото приміщення.' },
  { title: 'Дзвінок', text: 'Ми уточнимо деталі й погодимо підсумкову ціну та час виїзду.' },
  { title: 'Прибирання', text: 'Бригада приїде зі своїм інвентарем і засобами. Оплата — після.' },
]

const faq = [
  { q: 'Чи потрібна передоплата?', a: 'Ні. Онлайн-оплати немає: ціну погоджуємо телефоном, оплачуєте після прибирання.' },
  { q: 'Ціна в розрахунку остаточна?', a: 'Це орієнтовна вартість за нашою формулою. Підсумкову ціну майстер погоджує з вами до виїзду — вона зʼявиться на сторінці заявки.' },
  { q: 'Куди вказати код домофона чи ключі?', a: 'Нікуди. Коди, ключі й паролі від дверей ми обговорюємо лише телефоном — у формі їх не збираємо.' },
  { q: 'Хто бачить фото приміщення?', a: 'Лише власник компанії в кабінеті. Фото стискаємо, прибираємо з них геодані й не публікуємо за відкритими посиланнями.' },
  { q: 'У мене тварини чи алергія — що робити?', a: 'Напишіть про це в коментарі до заявки: бригада підбере засоби й попередить заздалегідь.' },
]

usePageSeo({
  title: 'Прибирання квартир і будинків з виїздом',
  description: `Підтримуюче, генеральне, після ремонту й миття вікон у місті ${company.value.city}. Миттєвий розрахунок вартості, заявка онлайн, ціну погоджуємо до виїзду.`,
  path: '/',
})
useLocalBusinessSchema()
</script>

<style lang="scss" scoped>
.hero {
  display: grid;
  grid-template-areas: 'copy' 'visual' 'facts';
  gap: $sp-5;
  padding-top: $sp-5;

  @include up($bp-lg) {
    grid-template-columns: 1fr 1.05fr;
    grid-template-areas: 'copy visual' 'facts visual';
    grid-template-rows: auto 1fr;
    column-gap: $sp-7;
    row-gap: $sp-5;
    padding-top: $sp-7;
  }

  &__copy {
    grid-area: copy;
    display: grid;
    gap: $sp-4;
    align-content: end;
  }

  &__title {
    font-size: $fs-4xl;
  }

  &__lead {
    max-width: 52ch;
    font-size: $fs-lg;
    color: $c-ink-2;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $sp-3;
    margin-top: $sp-2;
  }

  &__facts {
    grid-area: facts;
    align-self: start;
    display: grid;
    gap: $sp-3;
    margin: 0;
    padding: 0;
    list-style: none;

    @include up($bp-sm) {
      grid-template-columns: repeat(3, 1fr);
    }

    li {
      display: grid;
      gap: 2px;
      padding-left: $sp-3;
      border-left: $border-strong solid $c-accent;
      font-size: $fs-sm;
    }

    span {
      color: $c-ink-2;
    }
  }

  &__visual {
    grid-area: visual;
    display: grid;
    gap: $sp-3;
    align-self: center;
  }

  &__stage {
    height: clamp(320px, 62vw, 520px);
  }

  &__cast {
    display: flex;
    gap: $sp-2;
    overflow-x: auto;
    padding-bottom: $sp-1;
    scrollbar-width: thin;
  }

  &__chip {
    display: grid;
    flex: none;
    gap: 2px;
    min-height: $tap;
    padding: $sp-2 $sp-4;
    border: $border-strong solid $c-line;
    border-radius: $r-md;
    background: $c-surface;
    text-align: left;
    transition:
      border-color $dur-fast $ease-out,
      background-color $dur-fast $ease-out;

    &:hover {
      border-color: $c-ink-3;
    }

    &[aria-pressed='true'] {
      border-color: $c-accent;
      background: $c-accent-soft;
    }
  }

  &__chip-name {
    font-weight: $fw-bold;
    font-size: $fs-sm;
  }

  &__chip-type {
    font-size: $fs-xs;
    color: $c-ink-2;
  }
}

.section {
  margin-top: $sp-8;

  @include up($bp-md) {
    margin-top: $sp-9;
  }

  &__head {
    display: grid;
    gap: $sp-2;
    max-width: 640px;
    margin-bottom: $sp-6;
  }

  &__title {
    font-size: $fs-3xl;
  }
}

.services {
  display: grid;
  gap: $sp-4;

  @include up($bp-md) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include up($bp-lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.steps {
  display: grid;
  gap: $sp-4;
  margin: 0;
  padding: 0;
  list-style: none;

  @include up($bp-md) {
    grid-template-columns: repeat(4, 1fr);
  }

  &__item {
    display: grid;
    gap: $sp-2;
    align-content: start;
    padding: $sp-5;
    border-radius: $r-lg;
    background: $c-surface;
  }

  &__num {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $c-accent;
    color: $c-accent-ink;
    font-family: $font-display;
    font-weight: $fw-semibold;
  }

  &__title {
    font-size: $fs-lg;
  }
}

.pricing {
  display: grid;
  gap: $sp-6;
  padding: $sp-5;
  border-radius: $r-xl;
  background: $c-surface;

  @include up($bp-md) {
    grid-template-columns: 1.1fr 1fr;
    padding: $sp-7;
  }

  &__copy {
    display: grid;
    gap: $sp-4;
    align-content: start;
  }

  &__formula {
    display: grid;
    gap: $sp-2;
    margin: 0;
    padding-left: $sp-5;
    font-weight: $fw-medium;
  }

  &__subtitle {
    margin-bottom: $sp-3;
    font-size: $fs-lg;
  }
}

.extras {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;

  &__row {
    display: flex;
    justify-content: space-between;
    gap: $sp-3;
    padding: $sp-3 0;
    border-bottom: $border solid $c-line;
    font-size: $fs-sm;
  }

  &__price {
    font-weight: $fw-semibold;
    white-space: nowrap;
  }
}

.faq {
  display: grid;
  gap: $sp-2;
  max-width: 820px;

  &__item {
    padding: $sp-4 $sp-5;
    border-radius: $r-md;
    background: $c-surface;

    summary {
      min-height: $tap-sm;
      display: flex;
      align-items: center;
      font-weight: $fw-semibold;
      cursor: pointer;
    }

    p {
      margin-top: $sp-2;
    }
  }
}

.cta {
  display: grid;
  gap: $sp-3;
  justify-items: start;
  padding: $sp-6;
  border-radius: $r-xl;
  background: $c-accent;
  color: $c-accent-ink;

  @include up($bp-md) {
    padding: $sp-7;
  }

  &__title {
    font-size: $fs-3xl;
  }
}
</style>
