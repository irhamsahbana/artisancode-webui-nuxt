<script setup lang="ts">
defineOptions({ name: 'InvoicesPage' })

const currencyFormat = (value: unknown) => {
  const amount = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(amount)) return '-'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
}

const columns = [
  { key: 'invoice_number', label: 'Invoice' },
  {
    key: 'amount',
    label: 'Amount',
    format: (value: unknown) => currencyFormat(value),
  },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'due_date', label: 'Due Date' },
]
</script>

<template>
  <ResourceList
    title="Invoices"
    endpoint="/invoices"
    :columns="columns"
    :search-key="null"
    loading-variant="skeleton"
    :can-delete="false"
  />
</template>
