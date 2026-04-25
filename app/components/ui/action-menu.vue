<script setup lang="ts">
import { MoreVertical } from 'lucide-vue-next'

defineOptions({ name: 'UiActionMenu' })

type ActionMenuItem = {
  key: string
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    open?: boolean
    label?: string
    items: ActionMenuItem[]
  }>(),
  {
    open: false,
    label: 'Actions',
  },
)

const emit = defineEmits<{
  toggle: []
  close: []
  select: [key: string]
}>()
</script>

<template>
  <div class="relative">
    <button
      v-if="props.open"
      type="button"
      class="fixed inset-0 z-30 cursor-default bg-transparent"
      :aria-label="props.label"
      @click="emit('close')"
    />
    <Button
      variant="outline"
      size="icon"
      :class="[
        'h-9 w-9 rounded-md',
        props.open ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : '',
      ]"
      :aria-label="props.label"
      @click="emit('toggle')"
    >
      <MoreVertical class="h-4 w-4" />
    </Button>

    <div
      v-if="props.open"
      class="absolute right-0 z-40 mt-2 min-w-32 overflow-hidden rounded-md border bg-popover text-sm shadow-md"
    >
      <button
        v-for="item in props.items"
        :key="item.key"
        type="button"
        class="block w-full px-3 py-2 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="item.disabled"
        @click="emit('select', item.key)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
