<script setup lang="ts">
import AttendanceLogsPage from '~/modules/resources/attendance-logs/attendance-logs-page.vue'

definePageMeta({
  path: '/app/resources/attendance-logs/:id?',
})
</script>

<template>
  <AttendanceLogsPage />
</template>
