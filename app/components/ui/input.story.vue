<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import Input from './input.vue'
import Label from './label.vue'

defineOptions({ name: 'UiInputStory' })

const state = reactive({
  disabled: false,
  modelValue: 'Bandung HQ',
  placeholder: 'Masukkan nama lokasi',
  theme: 'light' as 'light' | 'dark',
})
</script>

<template>
  <Story
    title="UI/Input"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Default">
      <div
        class="mx-auto flex max-w-md flex-col gap-3 rounded-2xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900 text-slate-50' : 'bg-slate-100'"
      >
        <Label for="story-input">
          Work location
        </Label>
        <Input
          id="story-input"
          v-model="state.modelValue"
          :disabled="state.disabled"
          :placeholder="state.placeholder"
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
          v-model="state.modelValue"
          title="Value"
        />
        <HstText
          v-model="state.placeholder"
          title="Placeholder"
        />
        <HstCheckbox
          v-model="state.disabled"
          title="Disabled"
        />
      </template>
    </Variant>
  </Story>
</template>
