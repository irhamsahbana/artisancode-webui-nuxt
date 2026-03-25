<script setup lang="ts">
import CategoriesPage from '~/modules/resources/categories/categories-page.vue'

defineOptions({ name: 'CategoriesRoutePage' })

definePageMeta({
  path: '/resources/categories/:id?',
})
</script>

<template>
  <CategoriesPage />
</template>
