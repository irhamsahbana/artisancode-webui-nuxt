<script setup lang="ts">
import TeachersPage from '~/modules/resources/teachers/teachers-page.vue'

defineOptions({ name: 'TeachersRoutePage' })

definePageMeta({
  path: '/resources/teachers/:id?',
})
</script>

<template>
  <TeachersPage />
</template>
