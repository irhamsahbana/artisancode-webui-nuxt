<script setup lang="ts">
import TenantBillingPage from "~/modules/shared/billing/tenant-billing-page.vue";

defineOptions({ name: "TenantBillingCheckoutRoutePage" });

definePageMeta({
  path: "/app/billing/checkout",
});
</script>

<template>
  <TenantBillingPage view="checkout" />
</template>
