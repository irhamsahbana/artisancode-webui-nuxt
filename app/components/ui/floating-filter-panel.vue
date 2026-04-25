<script setup lang="ts">
defineOptions({ name: 'UiFloatingFilterPanel' })

const props = withDefaults(
  defineProps<{
    open?: boolean
    closeLabel?: string
    widthClass?: string
  }>(),
  {
    open: false,
    closeLabel: 'Close filters',
    widthClass: 'w-[min(1120px,calc(100vw-4rem))]',
  },
)

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <button
    v-if="props.open"
    type="button"
    class="fixed inset-0 z-30 cursor-default bg-transparent"
    :aria-label="props.closeLabel"
    @click="emit('close')"
  />
  <div
    v-if="props.open"
    :class="[
      'absolute left-1/2 top-12 z-40 -translate-x-1/2 overflow-hidden rounded-sm border border-border bg-background shadow-xl dark:bg-slate-950',
      props.widthClass,
    ]"
  >
    <slot />
  </div>
</template>
