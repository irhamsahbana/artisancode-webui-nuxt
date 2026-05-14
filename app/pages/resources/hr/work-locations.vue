<script setup lang="ts">
import WorkLocationsPage from '~/modules/resources/hr/work-locations/work-locations-page.vue'

defineOptions({ name: 'WorkLocationsRoutePage' })

definePageMeta({
  path: '/app/resources/work-locations',
})
</script>

<template>
  <WorkLocationsPage />
</template>
