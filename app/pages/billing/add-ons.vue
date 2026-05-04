<script setup lang="ts">
import TenantBillingPage from '~/modules/billing/tenant-billing-page.vue'

defineOptions({ name: 'TenantBillingAddOnsRoutePage' })

definePageMeta({
  path: '/app/billing/add-ons',
})
</script>

<template>
  <TenantBillingPage view="add-ons" />
</template>
