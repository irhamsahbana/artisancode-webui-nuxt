<script setup lang="ts">
import CategoriesPage from '~/modules/resources/crm/categories/categories-page.vue'

defineOptions({ name: 'CustomerTypesRoutePage' })

definePageMeta({
  path: '/app/resources/customer-types/:id?',
})
</script>

<template>
  <CategoriesPage category-group="customer_type" />
</template>
