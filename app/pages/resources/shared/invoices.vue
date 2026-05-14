<script setup lang="ts">
import InvoicesPage from '~/modules/resources/shared/invoices/invoices-page.vue'

defineOptions({ name: 'InvoicesRoutePage' })

definePageMeta({
  path: '/app/resources/invoices/:id?',
})
</script>

<template>
  <InvoicesPage />
</template>
