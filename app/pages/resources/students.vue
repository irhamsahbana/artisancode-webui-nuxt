<script setup lang="ts">
import StudentsPage from '~/modules/resources/students/students-page.vue'

defineOptions({ name: 'StudentsRoutePage' })

definePageMeta({
  path: '/app/resources/students',
})
</script>

<template>
  <StudentsPage />
</template>
