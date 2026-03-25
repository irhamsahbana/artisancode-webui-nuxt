<script setup lang="ts">
import { cn } from '~/utils/utils'
</script>

<template>
  <thead
    v-bind="$attrs"
    :class="cn('[&_tr]:border-b', $attrs.class as string)"
  >
    <slot />
  </thead>
</template>
