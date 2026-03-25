<script setup lang="ts">
import { cn } from '~/utils/utils'
</script>

<template>
  <caption
    v-bind="$attrs"
    :class="cn('mt-4 text-sm text-muted-foreground', $attrs.class as string)"
  >
    <slot />
  </caption>
</template>
