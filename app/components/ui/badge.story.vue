<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import Badge from './badge.vue'

defineOptions({ name: 'UiBadgeStory' })

const state = reactive({
  label: 'Aktif',
  theme: 'light' as 'light' | 'dark',
})
</script>

<template>
  <Story
    title="UI/Badge"
    :layout="{ type: 'grid', width: 220 }"
  >
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
        v-model="state.label"
        title="Label"
      />
    </template>

    <Variant title="Default">
      <div
        class="flex items-center justify-center p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Badge>{{ state.label }}</Badge>
      </div>
    </Variant>

    <Variant title="Secondary">
      <div
        class="flex items-center justify-center p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Badge variant="secondary">
          {{ state.label }}
        </Badge>
      </div>
    </Variant>

    <Variant title="Outline">
      <div
        class="flex items-center justify-center p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Badge variant="outline">
          {{ state.label }}
        </Badge>
      </div>
    </Variant>

    <Variant title="Destructive">
      <div
        class="flex items-center justify-center p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Badge variant="destructive">
          {{ state.label }}
        </Badge>
      </div>
    </Variant>
  </Story>
</template>
