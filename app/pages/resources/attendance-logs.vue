<script setup lang="ts">
import AttendanceLogsPage from '~/modules/resources/attendance-logs/attendance-logs-page.vue'

definePageMeta({
  path: '/resources/attendance-logs/:id?',
})
</script>

<template>
  <AttendanceLogsPage />
</template>
