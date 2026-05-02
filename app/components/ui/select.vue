<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/utils/utils'

defineOptions({ name: 'UiSelect' })

type SelectOption = {
  value: string | number
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    modelValue: null,
    placeholder: '',
    disabled: false,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number | null): void
}>()

const normalizedValue = computed(() => (
  props.modelValue === null ? '' : String(props.modelValue)
))

const hasPlaceholder = computed(() => props.placeholder.trim().length > 0)

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const nextValue = target.value
  const matchedOption = props.options.find((option) => String(option.value) === nextValue)

  if (nextValue === '' && hasPlaceholder.value) {
    emit('update:modelValue', null)
    return
  }

  emit('update:modelValue', matchedOption?.value ?? nextValue)
}
</script>

<template>
  <select
    v-bind="$attrs"
    :value="normalizedValue"
    :disabled="disabled"
    :class="cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', $attrs.class as string)"
    @change="handleChange"
  >
    <option
      v-if="hasPlaceholder"
      value=""
    >
      {{ placeholder }}
    </option>
    <option
      v-for="option in options"
      :key="String(option.value)"
      :value="String(option.value)"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>
