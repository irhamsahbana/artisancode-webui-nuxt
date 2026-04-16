<script setup lang="ts">
import { computed, useSlots } from 'vue'

import { cn } from '~/utils/utils'
import { localizeUiText } from '~/utils/ui-localization'

defineOptions({ name: 'UiLabel' })

const { locale } = useLocale()
const slots = useSlots()

const localizedText = computed(() => {
  const nodes = slots.default?.() ?? []
  const textChildren = nodes
    .map(node => (typeof node.children === 'string' ? node.children : null))
    .filter((value): value is string => value !== null)

  if (textChildren.length === 0 || textChildren.length !== nodes.length) {
    return null
  }

  return localizeUiText(locale.value, textChildren.join('').trim())
})
</script>

<template>
  <label
    v-bind="$attrs"
    :class="cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', $attrs.class as string)"
  >
    <template v-if="localizedText !== null">
      {{ localizedText }}
    </template>
    <slot v-else />
  </label>
</template>
