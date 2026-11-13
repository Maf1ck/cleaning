# Розгортання

Одна компанія — один екземпляр і одна база PostgreSQL.

## Що потрібно

- Node.js 22+, pnpm 10.
- PostgreSQL 14+ (свій сервер або керований: Neon, Supabase, Railway тощо). Таблиці створюються автоматично під час першого запиту (`server/db/migrations.ts`).
- Хостинг Node: VPS, Railway, Render, Fly.io або Vercel (Nitro preset).

## Змінні середовища

| Змінна | Обовʼязкова | Опис |
|---|---|---|
| `DATABASE_URL` | так (production) | `postgres://user:pass@host:5432/db?sslmode=require` |
| `NUXT_ADMIN_PASSWORD` | так, до першого входу | початковий пароль власника, ≥ 10 символів. Після першого входу хеш зберігається в базі; змінюйте в кабінеті |
| `NUXT_SECRET` | так (production) | випадковий рядок ≥ 32 символів (HMAC для IP) |
| `NUXT_PUBLIC_SITE_URL` | рекомендовано | `https://ваш-домен`: sitemap, canonical, перевірка Origin |

Без `DATABASE_URL` у production сервер навмисно не стартує. Вбудована PGlite (`.data/pglite`) — лише для локальної розробки й демо (`ALLOW_EMBEDDED_DB=1`). На serverless її використовувати не можна: файлова система там тимчасова.

## Node / VPS

```bash
pnpm install --frozen-lockfile
pnpm build
DATABASE_URL=... NUXT_ADMIN_PASSWORD=... NUXT_SECRET=... NUXT_PUBLIC_SITE_URL=https://example.com PORT=3000 node .output/server/index.mjs
```

Поставте перед застосунком HTTPS-проксі (Caddy або nginx), який передає `X-Forwarded-For`, `X-Forwarded-Proto` і `X-Forwarded-Host`.

## Vercel

1. Імпортуйте репозиторій. Налаштування збірки вже лежать у `vercel.json` (pnpm, `pnpm build`, регіон `fra1`, заголовки кешу для `/_nuxt` і `sw.js`). Preset Nitro `vercel` вмикається автоматично.
2. Додайте змінні середовища з таблиці вище й підключіть PostgreSQL (наприклад, Neon через Marketplace).
3. `sharp` має збірки під Linux x64. Якщо збірка падає на sharp, додайте `SHARP_IGNORE_GLOBAL_LIBVIPS=1`.
4. Ліміт тіла запиту на Vercel — 4,5 МБ. Браузер зменшує фото понад 1,5 МБ до 2048 px (JPEG 88%) перед завантаженням, тому звичайні фото з телефона проходять. Якщо браузер не вміє декодувати формат (наприклад, HEIC у старому Safari), файл буде відхилено з поясненням.

## Після розгортання

```bash
NUXT_ADMIN_PASSWORD=... node scripts/smoke.mjs https://ваш-домен
```

Скрипт створює вигадану заявку, проходить кабінет і видаляє її. Він тимчасово змінює й повертає тарифи, режим гри й пароль. Запускайте його до відкриття сайту клієнтам або в тихий час.

## Резервні копії

Налаштуйте автоматичні бекапи в провайдера PostgreSQL. Фото лежать у базі, окремого сховища файлів немає.
