<script setup lang="ts">
import { createInvoiceColumns } from './invoice-format'

defineOptions({ name: 'InvoicesPage' })
const { t } = useLocale()

const columns = createInvoiceColumns(t)
</script>

<template>
  <ResourceList
    :title="t('ui.invoices')"
    endpoint="/invoices"
    :columns="columns"
    :search-key="null"
    loading-variant="skeleton"
    :can-delete="false"
  />
</template>
