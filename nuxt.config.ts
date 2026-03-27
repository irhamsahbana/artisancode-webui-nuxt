// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],
  colorMode: {
    classSuffix: '',
    storageKey: 'ui_theme',
    preference: 'light',
    fallback: 'light',
  },
  components: [
    { path: '~/components', pathPrefix: false },
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    apiBase: '',
  },
  app: {
    head: {
      // Critical CSS inlined to prevent FOUC before Tailwind loads
      style: [
        {
          innerHTML: `
            html { background-color: #ffffff; color: #09090b; }
            html.dark { background-color: #09090b; color: #fafafa; }
            html, body { margin: 0; padding: 0; }
            [v-cloak] { display: none !important; }
          `,
        },
      ],
    },
  },
})
