<script setup lang="ts">
import InternalProductsPage from '~/modules/resources/internal-products/internal-products-page.vue'

defineOptions({ name: 'InternalProductsRoutePage' })

definePageMeta({
  path: '/app/internal/products/:id?',
})
</script>

<template>
  <InternalProductsPage />
</template>
