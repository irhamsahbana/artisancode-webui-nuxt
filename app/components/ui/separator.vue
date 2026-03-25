<script setup lang="ts">
import { cn } from '~/utils/utils'

defineOptions({ name: 'UiSeparator' })
</script>

<template>
  <div
    v-bind="$attrs"
    :class="cn('shrink-0 bg-border', $attrs.class as string)"
  />
</template>
