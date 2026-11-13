<template lang="pug">
article.doc.container
  p.eyebrow Документи
  h1 Атрибуція й ліцензії

  h2 3D-персонажі
  p
    | Гудзя, Мопик, Пшик, Скрипик і Пухлик — оригінальні процедурні моделі цього проєкту, зібрані з геометрії Three.js
    | (app/three/characters.ts). Сторонніх 3D-моделей, текстур і HDR-карт сайт не використовує; освітлення —
    | процедурне RoomEnvironment з Three.js. Моделі передаються разом із вихідним кодом на тих самих умовах.

  h2 Шрифти
  ul
    li
      a(href="https://fonts.google.com/specimen/Unbounded" target="_blank" rel="noopener") Unbounded
      |  — SIL Open Font License 1.1
    li
      a(href="https://fonts.google.com/specimen/Manrope" target="_blank" rel="noopener") Manrope
      |  — SIL Open Font License 1.1

  h2 Бібліотеки з відкритим кодом
  ul
    li(v-for="lib in libs" :key="lib.name")
      strong {{ lib.name }}
      |  — {{ lib.license }}
  p.muted Повний перелік із версіями — у файлі LICENSES.md репозиторію.
</template>

<script setup lang="ts">
const libs = [
  { name: 'Vue, Nuxt, Nitro, Vite', license: 'MIT' },
  { name: 'Three.js', license: 'MIT' },
  { name: 'TresJS (@tresjs/core, @tresjs/cientos)', license: 'MIT' },
  { name: 'Pinia', license: 'MIT' },
  { name: 'Zod', license: 'MIT' },
  { name: 'postgres (postgres.js)', license: 'Unlicense' },
  { name: 'PGlite (@electric-sql/pglite)', license: 'Apache-2.0 / PostgreSQL License' },
  { name: 'sharp / libvips', license: 'Apache-2.0 / LGPL-3.0-or-later' },
]

usePageSeo({ title: 'Атрибуція й ліцензії', description: 'Джерела 3D-моделей, шрифтів і бібліотек, використаних на сайті.', path: '/credits' })
</script>

<style lang="scss" scoped>
.doc {
  display: grid;
  gap: $sp-3;
  max-width: 760px;
  padding-top: $sp-6;

  h1 {
    font-size: $fs-3xl;
  }

  h2 {
    margin-top: $sp-4;
    font-size: $fs-xl;
  }

  ul {
    display: grid;
    gap: $sp-1;
    margin: 0;
    padding-left: $sp-5;
  }
}
</style>
