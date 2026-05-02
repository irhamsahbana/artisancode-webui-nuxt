import './app/assets/css/main.css'

import { createI18n } from 'vue-i18n'
import { defineComponent, h } from 'vue'
import { defineSetupVue3 } from '@histoire/plugin-vue'
import en from './i18n/locales/en'
import id from './i18n/locales/id'

const NuxtLinkStub = defineComponent({
  name: 'NuxtLink',
  props: {
    to: {
      type: [String, Object],
      required: false,
      default: '/',
    },
  },
  setup(props, { slots, attrs }) {
    const href = typeof props.to === 'string' ? props.to : '/'
    return () => h('a', { ...attrs, href }, slots.default?.())
  },
})

const i18n = createI18n({
  legacy: false,
  locale: 'id',
  fallbackLocale: 'en',
  messages: {
    en,
    id,
  },
})

export const setupVue3 = defineSetupVue3(({ app }) => {
  app.use(i18n)
  app.component('NuxtLink', NuxtLinkStub)
})

export const setupVanilla = () => {}
