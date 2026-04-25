<script setup lang="ts">
import JobPositionsPage from '~/modules/resources/job-positions/job-positions-page.vue'

defineOptions({ name: 'JobPositionsRoutePage' })

definePageMeta({
  path: '/app/resources/job-positions',
})
</script>

<template>
  <JobPositionsPage />
</template>
