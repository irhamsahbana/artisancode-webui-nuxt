<script setup lang="ts">
import CustomersPage from '~/modules/resources/crm/customers/customers-page.vue'

defineOptions({ name: 'CustomersRoutePage' })

definePageMeta({
  path: '/app/resources/customers/:id?',
})
</script>

<template>
  <CustomersPage />
</template>
