<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import Input from './input.vue'
import Label from './label.vue'

defineOptions({ name: 'UiLabelStory' })

const state = reactive({
  helper: 'Displayed under the field when extra guidance is needed.',
  label: 'Employee ID',
  theme: 'light' as 'light' | 'dark',
})
</script>

<template>
  <Story
    title="UI/Label"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Field label">
      <div
        class="mx-auto max-w-md rounded-3xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-950 text-slate-50' : 'bg-slate-100'"
      >
        <div class="space-y-2 rounded-2xl bg-background p-5 shadow-sm">
          <Label for="story-ui-label-input">
            {{ state.label }}
          </Label>
          <Input
            id="story-ui-label-input"
            model-value="EMP-22018"
          />
          <p class="text-sm text-muted-foreground">
            {{ state.helper }}
          </p>
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
          v-model="state.label"
          title="Label"
        />
        <HstText
          v-model="state.helper"
          title="Helper"
        />
      </template>
    </Variant>
  </Story>
</template>
