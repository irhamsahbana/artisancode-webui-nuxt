<script setup lang="ts">
import { navigateTo } from '#app'

defineOptions({ name: 'PermissionsPage' })

const localePath = useLocalePath()

await navigateTo(localePath('/app/resources/roles'))
</script>

<template>
  <div />
</template>
