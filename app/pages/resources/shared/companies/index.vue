<script setup lang="ts">
import CompaniesPage from "~/modules/resources/shared/companies/companies-page.vue";

defineOptions({ name: "CompaniesRoutePage" });

definePageMeta({
  path: "/app/resources/companies",
});
</script>

<template>
  <CompaniesPage />
</template>
