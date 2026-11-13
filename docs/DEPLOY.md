# Розгортання

Одна компанія — один екземпляр і одна база. Схема та сама, що в шаблоні кондитерської: **окремий сервер бази не потрібен**. Без `DATABASE_URL` застосунок сам створює вбудовану базу (PGlite — PostgreSQL, скомпільований у WASM) у теці з даними. Таблиці створюються автоматично під час першого запиту (`server/db/migrations.ts`).

## Варіанти зберігання

| Де працює сайт | `DATABASE_URL` | Де дані | Чи зберігаються |
|---|---|---|---|
| VPS / свій сервер (рекомендовано) | не потрібна | `.data/pglite` поруч із застосунком (або `DATA_DIR`) | так, постійно |
| VPS / будь-який хостинг | PostgreSQL | у PostgreSQL | так |
| Vercel | **PostgreSQL обовʼязково** (Neon, Supabase…) | у PostgreSQL | так |
| Vercel без бази | не задана | `/tmp/prybrano` | **ні**: зникають при кожному холодному старті; кабінет показує червоне попередження |

Фото лежать у тій самій базі, окремого сховища файлів не потрібно.

## Змінні середовища

| Змінна | Обовʼязкова | Опис |
|---|---|---|
| `NUXT_ADMIN_PASSWORD` | так, до першого входу | початковий пароль власника, ≥ 10 символів. Після першого входу хеш зберігається в базі; змінюйте в кабінеті |
| `DATABASE_URL` | лише для Vercel / зовнішнього PostgreSQL | `postgres://user:pass@host:5432/db?sslmode=require` |
| `DATA_DIR` | ні | тека для вбудованої бази й згенерованого секрету (за замовчуванням `.data`) |
| `NUXT_SECRET` | рекомендовано | випадковий рядок ≥ 32 символів (HMAC для IP). Якщо не задано, генерується один раз і зберігається в `DATA_DIR/secret` |
| `NUXT_PUBLIC_SITE_URL` | рекомендовано | `https://ваш-домен`: sitemap, canonical, перевірка Origin |

## VPS (як кондитерська): nginx → Node (systemd) → файл бази

```bash
git clone https://github.com/Maf1ck/cleaning.git /home/deploy/cleaning
cd /home/deploy/cleaning
pnpm install --frozen-lockfile
pnpm build
```

`/etc/systemd/system/cleaning.service`:

```ini
[Unit]
Description=Prybrano cleaning site
After=network.target

[Service]
User=deploy
WorkingDirectory=/home/deploy/cleaning
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATA_DIR=/home/deploy/cleaning-data
Environment=NUXT_ADMIN_PASSWORD=змініть-мене-на-свій
Environment=NUXT_PUBLIC_SITE_URL=https://ваш-домен
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now cleaning
```

nginx проксує `https://ваш-домен` на `http://127.0.0.1:3000` і передає `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host`. HTTPS — через certbot. `client_max_body_size 15m;` — для фото.

Тримайте `DATA_DIR` поза текою з кодом, щоб `git pull` і перезбірка її не чіпали.

### Оновлення

```bash
cd /home/deploy/cleaning && git pull && pnpm install --frozen-lockfile && pnpm build && sudo systemctl restart cleaning
```

### Резервні копії вбудованої бази

PGlite зберігає базу як теку. Копіюйте її, поки сервіс зупинений (кілька секунд простою), наприклад щоночі через cron:

```bash
DAY=$(date +%F)
sudo systemctl stop cleaning
tar -czf /home/deploy/backups/cleaning-$DAY.tar.gz -C /home/deploy cleaning-data
sudo systemctl start cleaning
find /home/deploy/backups -name 'cleaning-*.tar.gz' -mtime +14 -delete
```

Відновлення: зупинити сервіс → розпакувати архів у `DATA_DIR` → запустити.

## Vercel

1. Імпортуйте репозиторій. Налаштування збірки вже лежать у `vercel.json` (pnpm, `pnpm build`, регіон `fra1`, заголовки кешу для `/_nuxt` і `sw.js`). Preset Nitro `vercel` вмикається автоматично.
2. Підключіть PostgreSQL (наприклад, Neon через Storage / Marketplace) — Vercel сам додасть `DATABASE_URL`. Додайте `NUXT_ADMIN_PASSWORD`, `NUXT_SECRET`, `NUXT_PUBLIC_SITE_URL`.
3. Без `DATABASE_URL` сайт відкриється, але дані житимуть лише до перезапуску функції — годиться тільки для показу демо.
4. Ліміт тіла запиту на Vercel — 4,5 МБ. Браузер зменшує фото понад 1,5 МБ до 2048 px (JPEG 88%) перед завантаженням.

## Після розгортання

```bash
NUXT_ADMIN_PASSWORD=... node scripts/smoke.mjs https://ваш-домен
```

Скрипт створює вигадану заявку, проходить кабінет і видаляє її. Він тимчасово змінює й повертає тарифи, режим гри й пароль. Запускайте його до відкриття сайту клієнтам або в тихий час.
