<script setup lang="ts">
import TenantBillingPage from "~/modules/shared/billing/tenant-billing-page.vue";

defineOptions({ name: "TenantBillingSubscriptionRoutePage" });

definePageMeta({
  path: "/app/billing/subscription",
});
</script>

<template>
  <TenantBillingPage view="subscription" />
</template>
