// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      // Set via NUXT_PUBLIC_STATIC_BUILD=true (pnpm generate): scenario
      // persistence falls back to localStorage since there is no server.
      staticBuild: false,
    },
  },
  app: {
    head: {
      title: 'FIRE & Coast FI Planner',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  nitro: {
    storage: {
      scenarios: { driver: 'fs', base: './.data/scenarios' },
    },
    devStorage: {
      scenarios: { driver: 'fs', base: './.data/scenarios' },
    },
  },
})
