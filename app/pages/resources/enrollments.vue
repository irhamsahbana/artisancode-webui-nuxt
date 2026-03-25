<script setup lang="ts">
import EnrollmentsPage from '~/modules/resources/enrollments/enrollments-page.vue'

defineOptions({ name: 'EnrollmentsRoutePage' })

definePageMeta({
  path: '/resources/enrollments/:id?',
})
</script>

<template>
  <EnrollmentsPage />
</template>
