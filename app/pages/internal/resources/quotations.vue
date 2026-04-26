<script setup lang="ts">
import InternalCommerceListPage from '~/modules/internal-commerce/admin/internal-commerce-list-page.vue'

defineOptions({ name: 'InternalCommerceQuotationsRoutePage' })

definePageMeta({
  path: '/app/internal/quotations/:id?',
})
</script>

<template>
  <InternalCommerceListPage resource="quotations" />
</template>
