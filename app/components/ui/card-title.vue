<script setup lang="ts">
import { cn } from '~/utils/utils'
</script>

<template>
  <h3
    v-bind="$attrs"
    :class="cn('text-lg font-semibold leading-none tracking-tight', $attrs.class as string)"
  >
    <slot />
  </h3>
</template>
