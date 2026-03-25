<script setup lang="ts">
import CompaniesPage from '~/modules/resources/companies/companies-page.vue'

defineOptions({ name: 'CompaniesRoutePage' })

definePageMeta({
  path: '/resources/companies/:id?',
})
</script>

<template>
  <CompaniesPage />
</template>
