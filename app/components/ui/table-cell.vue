<script setup lang="ts">
import { cn } from '~/utils/utils'
</script>

<template>
  <td
    v-bind="$attrs"
    :class="cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', $attrs.class as string)"
  >
    <slot />
  </td>
</template>
