<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import InternalResourceFilterPanel from '../internal-resource-filter-panel.vue'
import { useDateTime } from '~/composables/useDateTime'
import InternalClientOwnerPermissionsDialog from './internal-client-owner-permissions-dialog.vue'
import { useInternalClientOwnerPermissions } from './use-internal-client-owner-permissions'

defineOptions({ name: 'InternalClientsPage' })

const { t } = useLocale()
const { formatDateTime } = useDateTime()
const { apiFetch } = useApi()
const { show } = useBanner()

const filterPanelOpen = ref(false)
const filters = reactive({
  owner: '',
})

const listQuery = computed(() => {
  const query: Record<string, string> = {}
  if (filters.owner.trim().length > 1) {
    query.owner = filters.owner.trim()
  }
  return query
})

const columns = computed(() => [
  { key: 'name', label: t('common.name') },
  { key: 'code', label: t('common.code') },
  { key: 'owner_names', label: t('ui.owner') },
  { key: 'owner_emails', label: t('ui.email') },
  {
    key: 'created_at',
    label: t('ui.createdAt'),
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

const {
  permissionDialogOpen,
  permissionDialogLoading,
  permissionSaving,
  selectedClientName,
  availablePermissions,
  selectedPermissionIds,
  openPermissionDialog,
  closePermissionDialog,
  togglePermission,
  saveOwnerPermissions,
} = useInternalClientOwnerPermissions()

const clearFilters = () => {
  filters.owner = ''
}

const toggleFilterPanel = () => {
  filterPanelOpen.value = !filterPanelOpen.value
}
</script>

<template>
  <div>
    <ResourceList
      :title="t('ui.clients')"
      endpoint="/internal-clients"
      :columns="columns"
      :extra-query="listQuery"
      loading-variant="skeleton"
      :search-placeholder="t('ui.searchClients')"
      :show-search-filter-trigger="true"
      :search-filter-open="filterPanelOpen"
      :can-view-detail="false"
      :can-delete="false"
      auth-mode="internal"
      @search-filter-trigger="toggleFilterPanel"
    >
      <template #filters>
        <InternalResourceFilterPanel
          v-model:open="filterPanelOpen"
          @clear="clearFilters"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="internal-client-owner-filter">{{ t('ui.owner') }}</Label>
              <Input
                id="internal-client-owner-filter"
                v-model="filters.owner"
                autocomplete="off"
                :placeholder="t('ui.searchOwnerNameOrEmail')"
              />
            </div>
          </div>
        </InternalResourceFilterPanel>
      </template>

      <template #row-actions="{ row, close }">
        <button
          class="w-full rounded px-3 py-2 text-left hover:bg-accent"
          type="button"
          role="menuitem"
          @click="openPermissionDialog(row, close)"
        >
          {{ t('ui.editOwnerPermissions') }}
        </button>
      </template>
    </ResourceList>

    <InternalClientOwnerPermissionsDialog
      :client-name="selectedClientName"
      :loading="permissionDialogLoading"
      :open="permissionDialogOpen"
      :permissions="availablePermissions"
      :saving="permissionSaving"
      :selected-permission-ids="selectedPermissionIds"
      @close="closePermissionDialog"
      @save="saveOwnerPermissions"
      @toggle-permission="togglePermission"
    />
  </div>
</template>
