<script setup lang="ts">
import CategoriesPage from '~/modules/resources/crm/categories/categories-page.vue'

defineOptions({ name: 'AreasRoutePage' })

definePageMeta({
  path: '/app/resources/areas/:id?',
})
</script>

<template>
  <CategoriesPage category-group="area" />
</template>
