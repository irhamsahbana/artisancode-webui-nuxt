<script setup lang="ts">
import InternalCommerceListPage from '~/modules/internal-commerce/admin/internal-commerce-list-page.vue'

defineOptions({ name: 'InternalCommerceInvoicesRoutePage' })

definePageMeta({
  path: '/app/internal/invoices/:id?',
})
</script>

<template>
  <InternalCommerceListPage resource="invoices" />
</template>
