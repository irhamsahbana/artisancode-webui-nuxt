<script setup lang="ts">
import TenantBillingPage from '~/modules/billing/tenant-billing-page.vue'

defineOptions({ name: 'TenantBillingPaymentStatusRoutePage' })

definePageMeta({
  path: '/app/billing/payment-status',
})
</script>

<template>
  <TenantBillingPage view="payment-status" />
</template>
