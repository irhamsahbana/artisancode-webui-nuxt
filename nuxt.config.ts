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
    public: {
      appName: 'ArtisanCode',
    },
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      // Critical CSS inlined to prevent FOUC before Tailwind loads
      style: [
        {
          innerHTML: `
            html { background-color: #ffffff; color: #09090b; }
            html.dark { background-color: #09090b; color: #fafafa; }
            html, body { margin: 0; padding: 0; }
            body { min-height: 100vh; }
            img { display: block; max-width: 100%; }
            [v-cloak] { display: none !important; }
            .auth-shell {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1.5rem;
              position: relative;
              overflow: hidden;
              background-color: #0f172a;
            }
            .auth-shell::before,
            .auth-shell::after {
              content: "";
              position: absolute;
              border-radius: 9999px;
              filter: blur(64px);
              background: rgba(15, 110, 86, 0.18);
              pointer-events: none;
            }
            .auth-shell::before {
              width: 20rem;
              height: 20rem;
              top: -8rem;
              left: -8rem;
            }
            .auth-shell::after {
              width: 24rem;
              height: 24rem;
              right: -10rem;
              bottom: -10rem;
            }
            .auth-card {
              position: relative;
              width: 100%;
              max-width: 32rem;
              border-radius: 1rem;
              border: 1px solid rgba(51, 65, 85, 0.9);
              background: rgba(2, 6, 23, 0.92);
              box-shadow: 0 24px 80px -40px rgba(2, 6, 23, 0.95);
            }
            .auth-card--wide {
              max-width: 36rem;
            }
            .auth-card-header,
            .auth-card-content,
            .auth-card-footer {
              position: relative;
              z-index: 1;
            }
            .auth-logo-frame {
              width: 3.5rem;
              height: 3.5rem;
              margin: 0 auto 0.75rem;
              overflow: hidden;
              border-radius: 1rem;
              border: 1px solid rgba(51, 65, 85, 0.9);
              background: rgba(15, 23, 42, 0.9);
            }
            .auth-title {
              margin: 0;
              font-size: 1.5rem;
              line-height: 2rem;
              font-weight: 700;
              text-align: center;
            }
            .auth-description {
              margin: 0.5rem 0 0;
              font-size: 0.875rem;
              line-height: 1.25rem;
              text-align: center;
              color: rgba(226, 232, 240, 0.72);
            }
          `,
        },
      ],
    },
  },
})
