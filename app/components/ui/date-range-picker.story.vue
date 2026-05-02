<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import DateRangePicker from './date-range-picker.vue'
import Label from './label.vue'

defineOptions({ name: 'UiDateRangePickerStory' })

const state = reactive({
  from: '2026-05-01',
  placeholder: 'Select date range',
  theme: 'light' as 'light' | 'dark',
  to: '2026-05-07',
})
</script>

<template>
  <Story
    title="UI/Date Range Picker"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Default">
      <div
        class="flex min-h-[44rem] items-start justify-center rounded-3xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-950 text-slate-50' : 'bg-slate-100'"
      >
        <div class="w-full max-w-xl space-y-3">
          <Label for="story-date-range-picker">
            Payroll window
          </Label>
          <DateRangePicker
            id="story-date-range-picker"
            v-model:from="state.from"
            v-model:to="state.to"
            :placeholder="state.placeholder"
            :teleport-to="null"
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
          v-model="state.from"
          title="From"
        />
        <HstText
          v-model="state.to"
          title="To"
        />
        <HstText
          v-model="state.placeholder"
          title="Placeholder"
        />
      </template>
    </Variant>
  </Story>
</template>
