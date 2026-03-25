<script setup lang="ts">
import { cn } from '~/utils/utils'

defineOptions({ name: 'UiCard' })
</script>

<template>
  <div
    v-bind="$attrs"
    :class="cn('rounded-lg border bg-card text-card-foreground shadow-sm', $attrs.class as string)"
  >
    <slot />
  </div>
</template>
