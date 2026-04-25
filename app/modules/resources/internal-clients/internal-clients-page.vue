<script setup lang="ts">
import { computed } from 'vue'
import { useDateTime } from '~/composables/useDateTime'

defineOptions({ name: 'InternalClientsPage' })

const { text: uiText } = useLocale()
const { formatDateTime } = useDateTime()

const columns = computed(() => [
  { key: 'name', label: 'Client Name' },
  { key: 'code', label: 'Client Code' },
  { key: 'owner_names', label: 'Owner' },
  { key: 'owner_emails', label: 'Owner Email' },
  {
    key: 'created_at',
    label: 'Created At',
    format: (value: unknown) => {
      if (typeof value !== 'string' || !value) {
        return '-'
      }

      return formatDateTime(value, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    },
  },
])
</script>

<template>
  <ResourceList
    :title="uiText('Clients')"
    endpoint="/internal-clients"
    :columns="columns"
    loading-variant="skeleton"
    :can-view-detail="false"
    auth-mode="internal"
  />
</template>
