<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineOptions({ name: 'UiFormDialogShell' })

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    maxWidthClass?: string
  }>(),
  {
    description: '',
    maxWidthClass: 'max-w-2xl',
  },
)

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8"
    @click.self="handleClose"
  >
    <div
      :class="[
        'w-full overflow-hidden rounded-[30px] border border-border/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] shadow-[0_28px_90px_-54px_rgba(15,23,42,0.95)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]',
        props.maxWidthClass,
      ]"
    >
      <div class="flex items-start justify-between gap-4 border-b border-border/70 bg-muted/15 px-5 py-4 sm:px-6">
        <div class="min-w-0">
          <div class="text-lg font-semibold tracking-tight sm:text-xl">
            {{ props.title }}
          </div>
          <div
            v-if="props.description"
            class="mt-1 text-sm leading-6 text-muted-foreground"
          >
            {{ props.description }}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          class="h-9 w-9 shrink-0 rounded-xl"
          aria-label="Close dialog"
          @click="handleClose"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="max-h-[calc(100vh-10rem)] overflow-auto px-5 py-5 sm:px-6">
        <slot />
      </div>

      <div
        v-if="$slots.footer"
        class="border-t border-border/70 bg-muted/10 px-5 py-4 sm:px-6"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
