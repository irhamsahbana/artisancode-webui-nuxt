<script setup lang="ts">
import PermissionsPage from '~/modules/resources/shared/permissions/permissions-page.vue'

defineOptions({ name: 'PermissionsRoutePage' })

definePageMeta({
  path: '/app/resources/permissions/:id?',
})
</script>

<template>
  <PermissionsPage />
</template>
