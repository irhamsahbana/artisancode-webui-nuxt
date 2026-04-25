<script setup lang="ts">
import StudentDetailPage from '~/modules/resources/students/student-detail-page.vue'

defineOptions({ name: 'StudentDetailRoutePage' })

definePageMeta({
  path: '/app/resources/students/:id',
})
</script>

<template>
  <StudentDetailPage />
</template>
