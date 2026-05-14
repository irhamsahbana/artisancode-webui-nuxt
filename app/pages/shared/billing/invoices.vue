<script setup lang="ts">
import TenantBillingPage from "~/modules/shared/billing/tenant-billing-page.vue";

defineOptions({ name: "TenantBillingInvoicesRoutePage" });

definePageMeta({
  path: "/app/billing/invoices",
});
</script>

<template>
  <TenantBillingPage view="invoices" />
</template>
