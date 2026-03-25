<script setup lang="ts">
import { cn } from '~/utils/utils'
</script>

<template>
  <div
    v-bind="$attrs"
    :class="cn('p-6 pt-0', $attrs.class as string)"
  >
    <slot />
  </div>
</template>
