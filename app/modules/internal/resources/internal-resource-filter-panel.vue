<script setup lang="ts">
defineOptions({ name: 'InternalResourceFilterPanel' })

const props = withDefaults(
  defineProps<{
    title?: string
    clearLabel?: string
    applyLabel?: string
  }>(),
  {
    title: 'ui.filters',
    clearLabel: 'ui.clearFilter',
    applyLabel: 'ui.submit',
  },
)

const emit = defineEmits<{
  clear: []
}>()

const { t } = useLocale()
const open = defineModel<boolean>('open', { default: false })

const close = () => {
  open.value = false
}
</script>

<template>
  <FloatingFilterPanel
    :open="open"
    :close-label="t('ui.closeFilters')"
    @close="close"
  >
    <div class="border-b border-border px-4 py-3 text-xs font-semibold text-foreground">
      {{ t(props.title) }}
    </div>

    <div class="max-h-[62vh] overflow-auto">
      <div class="p-4">
        <slot />
      </div>
    </div>

    <div class="flex items-center justify-end gap-4 border-t border-border bg-background px-4 py-3 dark:bg-slate-950">
      <Button
        variant="ghost"
        size="sm"
        class="text-destructive hover:text-destructive"
        @click="emit('clear')"
      >
        {{ t(props.clearLabel) }}
      </Button>
      <Button
        size="sm"
        @click="close"
      >
        {{ t(props.applyLabel) }}
      </Button>
    </div>
  </FloatingFilterPanel>
</template>
