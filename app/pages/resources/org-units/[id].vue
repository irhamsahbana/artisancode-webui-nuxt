<script setup lang="ts">
import OrgUnitDetailPage from '~/modules/resources/org-units/org-unit-detail-page.vue'

defineOptions({ name: 'OrgUnitDetailRoutePage' })

definePageMeta({
  path: '/app/resources/org-units/:id',
})
</script>

<template>
  <OrgUnitDetailPage />
</template>
