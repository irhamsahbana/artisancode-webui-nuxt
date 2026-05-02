<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import { logEvent } from 'histoire/client'
import LayoutBanner from './layout-banner.vue'

defineOptions({ name: 'LayoutBannerStory' })

const state = reactive({
  message: 'Tenant berhasil diperbarui.',
  theme: 'light' as 'light' | 'dark',
  variant: 'success' as 'error' | 'success' | 'info',
  visible: true,
})
</script>

<template>
  <Story
    title="Layout/Banner"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Floating banner">
      <div
        class="relative min-h-[12rem] rounded-3xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <LayoutBanner
          :close-label="'Tutup'"
          :message="state.message"
          :variant="state.variant"
          :visible="state.visible"
          @close="logEvent('close-banner', { visible: state.visible, variant: state.variant })"
        />
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
          v-model="state.message"
          title="Message"
        />
        <HstCheckbox
          v-model="state.visible"
          title="Visible"
        />
        <HstSelect
          v-model="state.variant"
          title="Variant"
          :options="[
            { label: 'Success', value: 'success' },
            { label: 'Info', value: 'info' },
            { label: 'Error', value: 'error' },
          ]"
        />
      </template>
    </Variant>
  </Story>
</template>
