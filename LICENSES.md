# Ліцензії та джерела

## Власні ассети проєкту

| Ассет | Джерело | Умови |
|---|---|---|
| 3D-персонажі Гудзя, Мопик, Пшик, Скрипик, Пухлик | процедурна геометрія в `app/three/characters.ts`, `app/three/parts.ts`, створена для цього проєкту | передаються покупцю разом із вихідним кодом, без обмежень на комерційне використання |
| `models/*.glb` | експорт тих самих персонажів (`pnpm export:models`) | як вище |
| SVG-постери персонажів | `app/components/three/CharacterPoster.vue` | як вище |
| Логотип, PWA-іконки, OG-зображення | `public/icons/icon.svg`, `scripts/make-icons.mjs` | як вище |
| Освітлення сцени | `RoomEnvironment` із Three.js (процедурне, MIT) | MIT |

Сторонніх 3D-моделей, текстур, HDR-карт і фотографій проєкт не містить.

## Шрифти (Google Fonts)

| Шрифт | Ліцензія |
|---|---|
| Unbounded | SIL Open Font License 1.1 |
| Manrope | SIL Open Font License 1.1 |

Шрифти підключаються з `fonts.googleapis.com`. Щоб не звертатися до Google, завантажте їх локально й замініть посилання в `nuxt.config.ts`.

## Залежності

| Пакет | Версія | Ліцензія |
|---|---|---|
| nuxt | 4.6.4 | MIT |
| vue | 3.5.45 | MIT |
| three | 0.187.0 | MIT |
| @tresjs/core | 5.11.0 | MIT |
| @tresjs/cientos | 5.11.0 | MIT |
| pinia / @pinia/nuxt | 4.1.0 / 1.0.3 | MIT |
| zod | 4.6.7 | MIT |
| postgres (postgres.js) | 4.1.1 | Unlicense |
| @electric-sql/pglite | 0.5.16 | Apache-2.0 (містить PostgreSQL, PostgreSQL License) |
| sharp | 0.35.5 | Apache-2.0 (бінарні libvips — LGPL-3.0-or-later) |
| Dev: typescript, vue-tsc, vitest, pug, sass-embedded, @vue/language-plugin-pug | див. `package.json` | Apache-2.0 / MIT |

Повний перелік транзитивних залежностей:

```bash
pnpm licenses list
```
