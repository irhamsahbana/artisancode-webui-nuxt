<script setup lang="ts">
import OrgUnitsPage from '~/modules/resources/hr/org-units/org-units-page.vue'

defineOptions({ name: 'OrgUnitsRoutePage' })

definePageMeta({
  path: '/app/resources/org-units',
})
</script>

<template>
  <OrgUnitsPage />
</template>
