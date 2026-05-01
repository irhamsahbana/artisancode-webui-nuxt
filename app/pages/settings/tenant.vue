<script setup lang="ts">
import TenantSettingsPage from '~/modules/settings/tenant-settings-page.vue'

defineOptions({ name: 'TenantSettingsRoutePage' })

definePageMeta({
  path: '/app/settings/tenant',
})
</script>

<template>
  <TenantSettingsPage />
</template>
