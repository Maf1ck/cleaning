import type { CleaningType, ExtraId, Frequency, OrderStatus } from '../types'

export const TYPE_LABELS: Record<CleaningType, string> = {
  maintenance: 'Підтримуюче',
  general: 'Генеральне',
  renovation: 'Після ремонту',
  windows: 'Миття вікон',
  other: 'Інше',
}

export interface ServiceInfo {
  type: CleaningType
  title: string
  lead: string
  includes: string[]
  excludes: string[]
  character: CharacterId
}

export type CharacterId = 'vacuum' | 'bucket' | 'spray' | 'squeegee' | 'sponge'

export const SERVICES: ServiceInfo[] = [
  {
    type: 'maintenance',
    title: TYPE_LABELS.maintenance,
    lead: 'Щоб удома було свіжо щотижня.',
    includes: ['Пил на відкритих поверхнях', 'Підлога: пилосос і вологе миття', 'Кухня й санвузол зовні', 'Винесення сміття'],
    excludes: ['Шафи всередині', 'Вікна', 'Техніка всередині'],
    character: 'vacuum',
  },
  {
    type: 'general',
    title: TYPE_LABELS.general,
    lead: 'Глибоко, у кожному куточку.',
    includes: ['Усе з підтримуючого', 'Плінтуси, двері, вимикачі', 'Фасади кухні й плитка', 'Нальот і накип у санвузлі'],
    excludes: ['Вікна', 'Шафи й техніка всередині (окремо)', 'Хімчистка меблів'],
    character: 'bucket',
  },
  {
    type: 'renovation',
    title: TYPE_LABELS.renovation,
    lead: 'Будівельний пил — наш профіль.',
    includes: ['Будпил з усіх поверхонь', 'Сліди фарби, затірки, скотчу', 'Миття підлоги в кілька етапів', 'Сантехніка й фурнітура'],
    excludes: ['Вивіз будсміття', 'Вікна (окремо)', 'Демонтаж плівок на фасаді'],
    character: 'spray',
  },
  {
    type: 'windows',
    title: TYPE_LABELS.windows,
    lead: 'Прозоро з обох боків.',
    includes: ['Скло з двох боків', 'Рами й підвіконня', 'Відливи, до яких можна безпечно дістати'],
    excludes: ['Висотні роботи з альпіністом', 'Ремонт фурнітури', 'Москітні сітки — за домовленістю'],
    character: 'squeegee',
  },
  {
    type: 'other',
    title: TYPE_LABELS.other,
    lead: 'Опишіть задачу, ми оцінимо за фото.',
    includes: ['Нестандартні задачі', 'Офіс, сходи, тераса', 'Окремі зони чи предмети'],
    excludes: ['Ціна до перегляду фото', 'Роботи з ризиком для здоровʼя'],
    character: 'sponge',
  },
]

export const SERVICE_BY_TYPE = Object.fromEntries(SERVICES.map((s) => [s.type, s])) as Record<CleaningType, ServiceInfo>

export const EXTRA_LABELS: Record<ExtraId, { title: string; unit: string }> = {
  oven: { title: 'Духовка всередині', unit: 'шт' },
  fridge: { title: 'Холодильник всередині', unit: 'шт' },
  microwave: { title: 'Мікрохвильовка', unit: 'шт' },
  cabinets: { title: 'Шафи всередині', unit: 'шафа' },
  balcony: { title: 'Прибирання балкона', unit: 'шт' },
  ironing: { title: 'Прасування', unit: 'год' },
  dishes: { title: 'Миття посуду', unit: 'раз' },
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  once: 'Разово',
  weekly: 'Щотижня',
  biweekly: 'Раз на два тижні',
  monthly: 'Раз на місяць',
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Нова',
  agreed: 'Погоджена',
  done: 'Виконана',
  cancelled: 'Скасована',
}

export const STATUS_HINTS: Record<OrderStatus, string> = {
  new: 'Заявку отримано. Ми зателефонуємо, щоб погодити ціну й час.',
  agreed: 'Ціну й час погоджено. Чекайте бригаду у визначений час.',
  done: 'Прибирання виконано. Дякуємо, що обрали нас!',
  cancelled: 'Заявку скасовано. Якщо це помилка — звʼяжіться з нами.',
}
