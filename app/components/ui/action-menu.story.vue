<script setup lang="ts">
import '~/assets/css/main.css'
import { computed, reactive } from 'vue'
import { logEvent } from 'histoire/client'
import ActionMenu from './action-menu.vue'

defineOptions({ name: 'UiActionMenuStory' })

const state = reactive({
  includeDisabled: true,
  open: false,
  theme: 'light' as 'light' | 'dark',
})

const items = computed(() => [
  { key: 'edit', label: 'Edit item' },
  { key: 'duplicate', label: 'Duplicate item' },
  { key: 'archive', label: 'Archive item', disabled: state.includeDisabled },
])
</script>

<template>
  <Story
    title="UI/Action Menu"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Default">
      <div
        class="flex min-h-[14rem] items-start justify-end rounded-3xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <ActionMenu
          :items="items"
          :open="state.open"
          @close="state.open = false"
          @select="logEvent('action-selected', { action: $event })"
          @toggle="state.open = !state.open"
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
        <HstCheckbox
          v-model="state.open"
          title="Open"
        />
        <HstCheckbox
          v-model="state.includeDisabled"
          title="Disable archive"
        />
      </template>
    </Variant>
  </Story>
</template>
