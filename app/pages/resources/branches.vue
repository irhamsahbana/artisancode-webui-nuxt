<script setup lang="ts">
import BranchesPage from '~/modules/resources/branches/branches-page.vue'

defineOptions({ name: 'BranchesRoutePage' })

definePageMeta({
  path: '/app/resources/branches/:id?',
})
</script>

<template>
  <BranchesPage />
</template>
