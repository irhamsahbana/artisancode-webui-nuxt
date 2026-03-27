<script setup lang="ts">
import CompaniesManagePage from '~/modules/resources/companies/companies-manage-page.vue'

defineOptions({ name: 'CompaniesManageRoutePage' })

definePageMeta({
  path: '/resources/companies/:id',
})
</script>

<template>
  <CompaniesManagePage />
</template>