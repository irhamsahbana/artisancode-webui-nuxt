<script setup lang="ts">
import { computed, useSlots } from 'vue'

import { cn } from '~/utils/utils'
import { localizeUiText } from '~/utils/ui-localization'

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
  <h3
    v-bind="$attrs"
    :class="cn('text-lg font-semibold leading-none tracking-tight', $attrs.class as string)"
  >
    <template v-if="localizedText !== null">
      {{ localizedText }}
    </template>
    <slot v-else />
  </h3>
</template>
