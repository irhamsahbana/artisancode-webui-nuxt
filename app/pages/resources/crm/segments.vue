<script setup lang="ts">
import CategoriesPage from '~/modules/resources/crm/categories/categories-page.vue'

defineOptions({ name: 'SegmentsRoutePage' })

definePageMeta({
  path: '/app/resources/segments/:id?',
})
</script>

<template>
  <CategoriesPage category-group="segment" />
</template>
