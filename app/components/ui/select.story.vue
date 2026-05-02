<script setup lang="ts">
import '~/assets/css/main.css'
import { computed, reactive } from 'vue'
import Label from './label.vue'
import UiSelect from './select.vue'

defineOptions({ name: 'UiSelectStory' })

const state = reactive({
  disabled: false,
  modelValue: '14',
  placeholder: 'Pilih rentang tren',
  theme: 'light' as 'light' | 'dark',
})

const options = computed(() => [
  { value: '7', label: '7 hari terakhir' },
  { value: '14', label: '14 hari terakhir' },
  { value: '30', label: '30 hari terakhir' },
])
</script>

<template>
  <Story
    title="UI/Select"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Default">
      <div
        class="mx-auto flex max-w-md flex-col gap-3 rounded-2xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900 text-slate-50' : 'bg-slate-100'"
      >
        <Label for="story-ui-select">
          Trend window
        </Label>
        <UiSelect
          id="story-ui-select"
          v-model="state.modelValue"
          :disabled="state.disabled"
          :options="options"
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
        <HstSelect
          v-model="state.modelValue"
          title="Value"
          :options="[
            { label: '7 hari', value: '7' },
            { label: '14 hari', value: '14' },
            { label: '30 hari', value: '30' },
          ]"
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
