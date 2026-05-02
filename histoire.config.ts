import { defineConfig } from 'histoire'
import { defaultColors } from 'histoire'
import { HstVue } from '@histoire/plugin-vue'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    HstVue(),
  ],
  setupFile: './histoire.setup.ts',
  storyMatch: [
    'app/components/ui/**/*.story.vue',
    'app/components/layout/**/*.story.vue',
  ],
  storyIgnored: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/.histoire/**',
    'docs/**',
    'i18n/**',
    'public/**',
    'app/pages/**',
    'app/modules/**',
    'app/composables/**',
    'app/middleware/**',
    'app/plugins/**',
    'app/testing/**',
    'app/components/auth/**',
    'app/components/resource/**',
  ],
  theme: {
    title: 'ArtisanCode UI Book',
    favicon: './public/favicon.png',
    logo: {
      square: fileURLToPath(new URL('./app/assets/histoire-brand.png', import.meta.url)),
      light: fileURLToPath(new URL('./app/assets/histoire-brand.png', import.meta.url)),
      dark: fileURLToPath(new URL('./app/assets/histoire-brand.png', import.meta.url)),
    },
    colors: {
      gray: defaultColors.slate,
      primary: defaultColors.emerald,
    },
    defaultColorScheme: 'light',
    logoHref: 'https://artisancode.com',
    storeColorScheme: false,
  },
  tree: {
    file: 'path',
    order: 'asc',
  },
  vite: {
    plugins: [vue()],
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    css: {
      postcss: {
        plugins: [
          tailwindcss({
            config: fileURLToPath(new URL('./tailwind.config.ts', import.meta.url)),
          }),
        ],
      },
    },
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./app', import.meta.url)),
        '@': fileURLToPath(new URL('./app', import.meta.url)),
      },
    },
    server: {
      port: 6060,
    },
  },
})
