<script setup lang="ts">
import CategoriesPage from '~/modules/resources/crm/categories/categories-page.vue'

defineOptions({ name: 'CategoriesRoutePage' })

definePageMeta({
  path: '/app/resources/categories/:id?',
})
</script>

<template>
  <CategoriesPage category-group="customer_type" />
</template>
