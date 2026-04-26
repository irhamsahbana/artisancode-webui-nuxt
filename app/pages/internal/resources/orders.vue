<script setup lang="ts">
import InternalCommerceListPage from '~/modules/internal-commerce/admin/internal-commerce-list-page.vue'

defineOptions({ name: 'InternalCommerceOrdersRoutePage' })

definePageMeta({
  path: '/app/internal/orders/:id?',
})
</script>

<template>
  <InternalCommerceListPage resource="orders" />
</template>
