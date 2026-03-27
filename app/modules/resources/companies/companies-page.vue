<script setup lang="ts">
defineOptions({ name: 'CompaniesPage' })

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At' },
]
</script>

<template>
  <ResourceList
    title="Companies"
    endpoint="/companies"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #cell:created_at="{ item }">
      <span v-if="item.created_at">
        {{ new Date(item.created_at).toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) }}
      </span>
      <span v-else>-</span>
    </template>
  </ResourceList>
</template>