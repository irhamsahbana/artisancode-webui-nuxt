<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'CompaniesPage' })

const { locale, t } = useLocale()
const { formatDateTime } = useDateTime()

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

const columns = computed(() => [
  { key: 'code', label: t('common.code') },
  { key: 'name', label: t('common.name') },
  { key: 'created_at', label: locale.value === 'en' ? 'Created At' : 'Dibuat Pada' },
])

const formatCreatedAt = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) {
    return '-'
  }

  return formatDateTime(value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }, value)
}
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
        {{ formatCreatedAt(item.created_at) }}
      </span>
      <span v-else>-</span>
    </template>
  </ResourceList>
</template>
