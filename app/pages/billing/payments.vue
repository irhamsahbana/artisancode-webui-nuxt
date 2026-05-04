<script setup lang="ts">
import TenantBillingPage from '~/modules/billing/tenant-billing-page.vue'

defineOptions({ name: 'TenantBillingPaymentsRoutePage' })

definePageMeta({
  path: '/app/billing/payments',
})
</script>

<template>
  <TenantBillingPage view="payments" />
</template>
