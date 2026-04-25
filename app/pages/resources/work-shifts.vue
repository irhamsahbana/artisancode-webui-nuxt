<script setup lang="ts">
import WorkShiftsPage from '~/modules/resources/work-shifts/work-shifts-page.vue'

defineOptions({ name: 'WorkShiftsRoutePage' })

definePageMeta({
  path: '/app/resources/work-shifts',
})
</script>

<template>
  <WorkShiftsPage />
</template>
