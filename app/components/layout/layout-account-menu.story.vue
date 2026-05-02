<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import { logEvent } from 'histoire/client'
import LayoutAccountMenu from './layout-account-menu.vue'

defineOptions({ name: 'LayoutAccountMenuStory' })

const state = reactive({
  currentLocaleBadge: 'Indonesia',
  displayName: 'Rani Putri',
  expanded: false,
  theme: 'light' as 'light' | 'dark',
  isInternalRoute: false,
  isSwitchingLocale: false,
  sessionActive: true,
  tenantName: 'ArtisanCode Ops',
})
</script>

<template>
  <Story
    title="Layout/Account Menu"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Default">
      <div
        class="flex items-end justify-center p-6 transition-colors"
        :class="[
          state.expanded ? 'min-h-[24rem] pt-24' : 'min-h-[18rem]',
          state.theme === 'dark' ? 'dark bg-slate-900/95' : 'bg-slate-100',
        ]"
      >
        <div class="w-full max-w-sm rounded-[32px] border border-sidebar-border/70 bg-sidebar/95 p-4 shadow-[0_28px_80px_-48px_rgba(2,6,23,0.35)] transition-colors dark:shadow-[0_28px_80px_-48px_rgba(2,6,23,0.95)]">
          <LayoutAccountMenu
            :current-locale-badge="state.currentLocaleBadge"
            :display-name="state.displayName"
            :expanded="state.expanded"
            :is-internal-route="state.isInternalRoute"
            :is-switching-locale="state.isSwitchingLocale"
            :session-active="state.sessionActive"
            :tenant-name="state.tenantName"
            @logout="logEvent('logout-clicked', { user: state.displayName })"
            @switch-locale="logEvent('switch-locale', { currentLocale: state.currentLocaleBadge })"
            @toggle="state.expanded = !state.expanded"
          />
        </div>
      </div>

      <template #controls>
        <HstSelect
          v-model="state.theme"
          title="Theme"
          :options="[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]"
        />
        <HstText
          v-model="state.displayName"
          title="Display name"
        />
        <HstText
          v-model="state.tenantName"
          title="Tenant"
        />
        <HstText
          v-model="state.currentLocaleBadge"
          title="Locale badge"
        />
        <HstCheckbox
          v-model="state.expanded"
          title="Expanded"
        />
        <HstCheckbox
          v-model="state.isInternalRoute"
          title="Internal route"
        />
        <HstCheckbox
          v-model="state.isSwitchingLocale"
          title="Locale loading"
        />
        <HstCheckbox
          v-model="state.sessionActive"
          title="Session active"
        />
      </template>
    </Variant>
  </Story>
</template>
