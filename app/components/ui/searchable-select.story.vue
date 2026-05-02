<script setup lang="ts">
import '~/assets/css/main.css'
import { computed, reactive } from 'vue'
import Label from './label.vue'
import SearchableSelect from './searchable-select.vue'

defineOptions({ name: 'UiSearchableSelectStory' })

const state = reactive({
  disabled: false,
  modelValue: 'bdg',
  placeholder: 'Pilih cabang',
  searchPlaceholder: 'Cari cabang',
  theme: 'light' as 'light' | 'dark',
})

const options = computed(() => [
  { value: 'bdg', label: 'Bandung HQ' },
  { value: 'jkt', label: 'Jakarta Selatan Office' },
  { value: 'sby', label: 'Surabaya Distribution Center' },
  { value: 'mks', label: 'Makassar Operations Hub' },
  { value: 'dps', label: 'Denpasar Support Point' },
])
</script>

<template>
  <Story
    title="UI/Searchable Select"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Default">
      <div
        class="mx-auto flex min-h-[18rem] max-w-md flex-col gap-3 rounded-2xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900 text-slate-50' : 'bg-slate-100'"
      >
        <Label for="story-searchable-select">
          Branch
        </Label>
        <SearchableSelect
          id="story-searchable-select"
          v-model="state.modelValue"
          :disabled="state.disabled"
          :options="options"
          :placeholder="state.placeholder"
          :search-placeholder="state.searchPlaceholder"
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
            { label: 'Bandung HQ', value: 'bdg' },
            { label: 'Jakarta', value: 'jkt' },
            { label: 'Surabaya', value: 'sby' },
            { label: 'Makassar', value: 'mks' },
            { label: 'Denpasar', value: 'dps' },
          ]"
        />
        <HstText
          v-model="state.placeholder"
          title="Placeholder"
        />
        <HstText
          v-model="state.searchPlaceholder"
          title="Search Placeholder"
        />
        <HstCheckbox
          v-model="state.disabled"
          title="Disabled"
        />
      </template>
    </Variant>
  </Story>
</template>
