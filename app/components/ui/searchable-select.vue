<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '~/utils/utils'

defineOptions({ name: 'UiSearchableSelect' })

type SelectOption = {
  value: string | number
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: SelectOption[]
    placeholder?: string
    searchPlaceholder?: string
    disabled?: boolean
  }>(),
  {
    modelValue: null,
    placeholder: 'Select option',
    searchPlaceholder: 'Search...',
    disabled: false,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number | null): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const query = ref('')
const debouncedQuery = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const selectedLabel = computed(() => {
  const matched = props.options.find((option) => option.value === props.modelValue)
  return matched?.label ?? ''
})

const filteredOptions = computed(() => {
  const term = debouncedQuery.value.trim().toLowerCase()
  const selectedTerm = selectedLabel.value.trim().toLowerCase()
  if (!term || term === selectedTerm) {
    return props.options
  }
  return props.options.filter((option) => option.label.toLowerCase().includes(term))
})

const openList = () => {
  if (props.disabled) {
    return
  }
  isOpen.value = true
}

const closeList = () => {
  isOpen.value = false
  query.value = selectedLabel.value
  debouncedQuery.value = selectedLabel.value
}

const selectOption = (option: SelectOption) => {
  emit('update:modelValue', option.value)
  isOpen.value = false
  query.value = option.label
  debouncedQuery.value = option.label
}

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  query.value = target.value
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = query.value
  }, 200)
  if (!isOpen.value) {
    isOpen.value = true
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (rootRef.value && !rootRef.value.contains(target)) {
    closeList()
  }
}

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      query.value = selectedLabel.value
      debouncedQuery.value = selectedLabel.value
    }
  },
  { immediate: true },
)

watch(
  () => props.options,
  () => {
    if (!isOpen.value) {
      query.value = selectedLabel.value
      debouncedQuery.value = selectedLabel.value
    }
  },
  { deep: true },
)

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative"
  >
    <input
      v-bind="$attrs"
      :value="query"
      :disabled="disabled"
      :placeholder="selectedLabel ? '' : props.placeholder"
      :class="cn('h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', $attrs.class as string)"
      @focus="openList"
      @input="onInput"
    >
    <div
      v-if="isOpen"
      class="absolute z-20 mt-1 w-full rounded-md border bg-popover p-1 text-sm shadow-md"
    >
      <div class="max-h-56 overflow-auto">
        <button
          v-for="option in filteredOptions"
          :key="String(option.value)"
          type="button"
          class="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-accent"
          @click="selectOption(option)"
        >
          <span>{{ option.label }}</span>
          <span
            v-if="option.value === props.modelValue"
            class="text-xs text-muted-foreground"
          >
            Selected
          </span>
        </button>
        <div
          v-if="filteredOptions.length === 0"
          class="px-3 py-2 text-muted-foreground"
        >
          No options
        </div>
      </div>
    </div>
  </div>
</template>
