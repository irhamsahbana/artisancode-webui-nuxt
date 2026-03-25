<script setup lang="ts">
import { cn } from '~/utils/utils'
</script>

<template>
  <tr
    v-bind="$attrs"
    :class="cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', $attrs.class as string)"
  >
    <slot />
  </tr>
</template>
