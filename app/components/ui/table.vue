<script setup lang="ts">
import { cn } from '~/utils/utils'

defineOptions({ name: 'UiTable' })
</script>

<template>
  <div class="w-full overflow-x-auto overflow-y-visible">
    <table
      v-bind="$attrs"
      :class="cn('w-full caption-bottom text-sm', $attrs.class as string)"
    >
      <slot />
    </table>
  </div>
</template>
