<script setup lang="ts">
import { cn } from '~/utils/utils'
</script>

<template>
  <tfoot
    v-bind="$attrs"
    :class="cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', $attrs.class as string)"
  >
    <slot />
  </tfoot>
</template>
