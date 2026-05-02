<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
  variant: 'error' | 'success' | 'info'
  closeLabel: string
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    v-if="visible"
    class="fixed left-1/2 top-4 z-[100] w-[90vw] max-w-2xl -translate-x-1/2 rounded-md border px-4 py-3 text-sm shadow-lg"
    :class="
      variant === 'error'
        ? 'border-destructive bg-destructive text-white'
        : variant === 'success'
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-accent bg-accent text-accent-foreground'
    "
    role="alert"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="font-medium">
        {{ message }}
      </div>
      <button
        type="button"
        class="shrink-0 rounded-md px-2 py-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
        @click="$emit('close')"
      >
        {{ closeLabel }}
      </button>
    </div>
  </div>
</template>
