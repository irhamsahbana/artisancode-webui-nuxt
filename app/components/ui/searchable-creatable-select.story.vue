<script setup lang="ts">
import '~/assets/css/main.css'
import { computed, reactive } from 'vue'
import Label from './label.vue'
import SearchableCreatableSelect from './searchable-creatable-select.vue'

defineOptions({ name: 'UiSearchableCreatableSelectStory' })

const state = reactive({
  disabled: false,
  modelValue: null as string | null,
  placeholder: 'Pilih atau buat perusahaan',
  searchPlaceholder: 'Cari perusahaan',
  theme: 'light' as 'light' | 'dark',
})

const sourceItems = reactive([
  { id: 'cmp-1', name: 'PT Arunika Karya' },
  { id: 'cmp-2', name: 'CV Laut Timur' },
  { id: 'cmp-3', name: 'PT Sinar Makassar' },
])

const currentLabel = computed(() => {
  return sourceItems.find(item => item.id === state.modelValue)?.name ?? state.modelValue ?? ''
})

const fetchOptions = async (query: string) => {
  const term = query.trim().toLowerCase()
  await new Promise(resolve => setTimeout(resolve, 180))

  return sourceItems
    .filter(item => !term || item.name.toLowerCase().includes(term))
    .map(item => ({
      value: item.id,
      label: item.name,
    }))
}

const createOption = async (query: string) => {
  await new Promise(resolve => setTimeout(resolve, 280))

  const id = `cmp-${sourceItems.length + 1}`
  const item = {
    id,
    name: query.trim(),
  }
  sourceItems.unshift(item)
  return {
    value: item.id,
    label: item.name,
  }
}
</script>

<template>
  <Story
    title="UI/Searchable Creatable Select"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Search And Create">
      <div
        class="mx-auto flex min-h-[20rem] max-w-md flex-col gap-3 rounded-2xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-900 text-slate-50' : 'bg-slate-100'"
      >
        <Label for="story-searchable-creatable-select">
          Company
        </Label>
        <SearchableCreatableSelect
          id="story-searchable-creatable-select"
          v-model="state.modelValue"
          :disabled="state.disabled"
          :fetch-options="fetchOptions"
          :create-option="createOption"
          :allow-create="true"
          :placeholder="state.placeholder"
          :search-placeholder="state.searchPlaceholder"
          :teleport-to="null"
        />
        <p class="text-sm text-muted-foreground">
          Current selection: {{ currentLabel || '-' }}
        </p>
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
