<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import Button from './button.vue'

defineOptions({ name: 'UiButtonStory' })

const state = reactive({
  label: 'Simpan perubahan',
  disabled: false,
  theme: 'light' as 'light' | 'dark',
})
</script>

<template>
  <Story
    title="UI/Button"
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
      <HstCheckbox
        v-model="state.disabled"
        title="Disabled"
      />
    </template>

    <Variant title="Default">
      <div
        class="flex items-center justify-center p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Button :disabled="state.disabled">
          {{ state.label }}
        </Button>
      </div>
    </Variant>

    <Variant title="Secondary">
      <div
        class="flex items-center justify-center p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Button
          variant="secondary"
          :disabled="state.disabled"
        >
          {{ state.label }}
        </Button>
      </div>
    </Variant>

    <Variant title="Outline">
      <div
        class="flex items-center justify-center p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Button
          variant="outline"
          :disabled="state.disabled"
        >
          {{ state.label }}
        </Button>
      </div>
    </Variant>

    <Variant title="Destructive">
      <div
        class="flex items-center justify-center p-4 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'"
      >
        <Button
          variant="destructive"
          :disabled="state.disabled"
        >
          {{ state.label }}
        </Button>
      </div>
    </Variant>
  </Story>
</template>
