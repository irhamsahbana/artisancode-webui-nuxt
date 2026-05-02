<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { computed } from 'vue'

defineOptions({ name: 'UiFloatingPanel' })

const props = withDefaults(
  defineProps<{
    open?: boolean
    title?: string
    description?: string
    widthClass?: string
    teleportTo?: string | null
  }>(),
  {
    open: false,
    title: '',
    description: '',
    widthClass: 'w-full max-w-md',
    teleportTo: 'body',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const useTeleportedPanel = computed(() => Boolean(props.teleportTo))

const close = () => {
  emit('update:open', false)
}
</script>

<template>
  <component
    :is="useTeleportedPanel ? 'Teleport' : 'div'"
    v-bind="useTeleportedPanel ? { to: props.teleportTo } : {}"
  >
    <div
      v-if="props.open"
      :class="useTeleportedPanel ? 'fixed inset-0 z-50' : 'absolute inset-0 z-50'"
    >
      <button
        type="button"
        aria-label="Close panel"
        class="absolute inset-0 bg-black/40"
        @click="close"
      />

      <div class="absolute inset-y-0 right-0 flex max-w-full items-stretch pl-6">
        <div
          :class="[
            'flex h-full flex-col border-l bg-background shadow-2xl',
            props.widthClass,
          ]"
        >
          <div class="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div class="min-w-0">
              <div
                v-if="props.title"
                class="text-base font-semibold"
              >
                {{ props.title }}
              </div>
              <div
                v-if="props.description"
                class="text-sm text-muted-foreground"
              >
                {{ props.description }}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 shrink-0"
              aria-label="Close panel"
              @click="close"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>

          <div class="min-h-0 flex-1 overflow-auto px-5 py-4">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="border-t px-5 py-4"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </component>
</template>
