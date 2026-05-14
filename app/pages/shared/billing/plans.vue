<script setup lang="ts">
import TenantBillingPage from "~/modules/shared/billing/tenant-billing-page.vue";

defineOptions({ name: "TenantBillingPlansRoutePage" });

definePageMeta({
  path: "/app/billing/plans",
});
</script>

<template>
  <TenantBillingPage view="plans" />
</template>
