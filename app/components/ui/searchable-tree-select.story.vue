<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import Label from './label.vue'
import SearchableTreeSelect from './searchable-tree-select.vue'

defineOptions({ name: 'UiSearchableTreeSelectStory' })

const state = reactive({
  disabled: false,
  modelValue: 'ops-mks',
  placeholder: 'Pilih unit organisasi',
  theme: 'light' as 'light' | 'dark',
})

const items = [
  { id: 'company', name: 'Artisan Code', parent_id: null },
  { id: 'ops', name: 'Operations', parent_id: 'company' },
  { id: 'ops-bdg', name: 'Bandung Ops', parent_id: 'ops' },
  { id: 'ops-mks', name: 'Makassar Ops', parent_id: 'ops' },
  { id: 'sales', name: 'Sales', parent_id: 'company' },
  { id: 'sales-jkt', name: 'Jakarta Enterprise', parent_id: 'sales' },
  { id: 'sales-sby', name: 'Surabaya SMB', parent_id: 'sales' },
]
</script>

<template>
  <Story
    title="UI/Searchable Tree Select"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Default">
      <div
        class="mx-auto flex min-h-[18rem] max-w-md flex-col gap-3 rounded-2xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900 text-slate-50' : 'bg-slate-100'"
      >
        <Label for="story-searchable-tree-select">
          Organization unit
        </Label>
        <SearchableTreeSelect
          id="story-searchable-tree-select"
          v-model="state.modelValue"
          :disabled="state.disabled"
          :items="items"
          :placeholder="state.placeholder"
          :teleport-to="null"
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
            { label: 'None', value: null },
            { label: 'Artisan Code', value: 'company' },
            { label: 'Operations', value: 'ops' },
            { label: 'Bandung Ops', value: 'ops-bdg' },
            { label: 'Makassar Ops', value: 'ops-mks' },
            { label: 'Sales', value: 'sales' },
            { label: 'Jakarta Enterprise', value: 'sales-jkt' },
            { label: 'Surabaya SMB', value: 'sales-sby' },
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
