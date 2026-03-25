<script setup lang="ts">
import { cn } from '~/utils/utils'
</script>

<template>
  <tbody
    v-bind="$attrs"
    :class="cn('[&_tr:last-child]:border-0', $attrs.class as string)"
  >
    <slot />
  </tbody>
</template>
