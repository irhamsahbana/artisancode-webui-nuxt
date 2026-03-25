<script setup lang="ts">
import InvoicesPage from '~/modules/resources/invoices/invoices-page.vue'

defineOptions({ name: 'InvoicesRoutePage' })

definePageMeta({
  path: '/resources/invoices/:id?',
})
</script>

<template>
  <InvoicesPage />
</template>
