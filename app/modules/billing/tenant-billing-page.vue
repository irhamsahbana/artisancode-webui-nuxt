<script setup lang="ts">
import { computed } from 'vue'

import TenantBillingPayments from './views/tenant-billing-payments.vue'
import TenantBillingSubscription from './views/tenant-billing-subscription.vue'
import TenantBillingPlans from './views/tenant-billing-plans.vue'
import TenantBillingCheckout from './views/tenant-billing-checkout.vue'
import TenantBillingInvoices from './views/tenant-billing-invoices.vue'
import TenantBillingAddOns from './views/tenant-billing-add-ons.vue'
import TenantBillingPaymentStatus from './views/tenant-billing-payment-status.vue'

defineOptions({ name: 'TenantBillingPage' })

const props = withDefaults(defineProps<{
  view?: string
}>(), {
  view: 'payments',
})

const activeView = computed(() => props.view)
</script>

<template>
  <TenantBillingPayments v-if="activeView === 'payments'" />
  <TenantBillingSubscription v-else-if="activeView === 'subscription'" />
  <TenantBillingPlans v-else-if="activeView === 'plans'" />
  <TenantBillingCheckout v-else-if="activeView === 'checkout'" />
  <TenantBillingInvoices v-else-if="activeView === 'invoices'" />
  <TenantBillingAddOns v-else-if="activeView === 'add-ons'" />
  <TenantBillingPaymentStatus v-else-if="activeView === 'payment-status'" />
  <div v-else class="space-y-6">
    <div class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      Unknown billing view: {{ activeView }}
    </div>
  </div>
</template>
