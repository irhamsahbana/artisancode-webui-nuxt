<script setup lang="ts">
import ProgramsPage from '~/modules/resources/programs/programs-page.vue'

defineOptions({ name: 'ProgramsRoutePage' })

definePageMeta({
  path: '/app/resources/programs/:id?',
})
</script>

<template>
  <ProgramsPage />
</template>
