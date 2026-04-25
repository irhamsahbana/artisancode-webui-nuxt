<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDateTime } from '~/composables/useDateTime'

defineOptions({ name: 'InternalClientsPage' })

const { text: uiText } = useLocale()
const { formatDateTime } = useDateTime()
const { apiFetch } = useApi()
const { show } = useBanner()

type PermissionItem = {
  id: string
  name?: string
  description?: string
}

type OwnerPermissionsResponse = {
  client_id: string
  available_permissions: PermissionItem[]
  owner_permission_ids: string[]
}

const permissionDialogOpen = ref(false)
const permissionDialogLoading = ref(false)
const permissionSaving = ref(false)
const selectedClient = ref<Record<string, unknown> | null>(null)
const availablePermissions = ref<PermissionItem[]>([])
const selectedPermissionIds = ref<string[]>([])

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

const selectedClientName = computed(() => {
  const name = selectedClient.value?.name
  return typeof name === 'string' && name.length > 0 ? name : '-'
})

const getClientId = (row: Record<string, unknown>) => {
  const id = row.id
  return typeof id === 'string' && id.length > 0 ? id : ''
}

const openPermissionDialog = async (row: Record<string, unknown>, close?: () => void) => {
  close?.()
  const clientId = getClientId(row)
  if (!clientId) {
    show(uiText('Client id is missing.'), 'error')
    return
  }

  selectedClient.value = row
  permissionDialogOpen.value = true
  permissionDialogLoading.value = true
  availablePermissions.value = []
  selectedPermissionIds.value = []

  const response = await apiFetch<OwnerPermissionsResponse>(`/internal-clients/${clientId}/owner-permissions`, {
    authMode: 'internal',
  })
  permissionDialogLoading.value = false

  if (!response.success || !response.data) {
    return
  }

  availablePermissions.value = response.data.available_permissions
  selectedPermissionIds.value = response.data.owner_permission_ids
}

const closePermissionDialog = () => {
  permissionDialogOpen.value = false
  permissionDialogLoading.value = false
  permissionSaving.value = false
  selectedClient.value = null
  availablePermissions.value = []
  selectedPermissionIds.value = []
}

const togglePermission = (permissionId: string) => {
  if (selectedPermissionIds.value.includes(permissionId)) {
    selectedPermissionIds.value = selectedPermissionIds.value.filter((id) => id !== permissionId)
    return
  }
  selectedPermissionIds.value = [...selectedPermissionIds.value, permissionId]
}

const saveOwnerPermissions = async () => {
  if (!selectedClient.value) {
    return
  }
  const clientId = getClientId(selectedClient.value)
  if (!clientId) {
    show(uiText('Client id is missing.'), 'error')
    return
  }

  permissionSaving.value = true
  const response = await apiFetch(`/internal-clients/${clientId}/owner-permissions`, {
    method: 'PUT',
    authMode: 'internal',
    body: {
      permission_ids: selectedPermissionIds.value,
    },
  })
  permissionSaving.value = false

  if (!response.success) {
    return
  }

  show(uiText('Owner permissions updated.'), 'success')
  closePermissionDialog()
}
</script>

<template>
  <div>
    <ResourceList
      :title="uiText('Clients')"
      endpoint="/internal-clients"
      :columns="columns"
      loading-variant="skeleton"
      :can-view-detail="false"
      :can-delete="false"
      auth-mode="internal"
    >
      <template #row-actions="{ row, close }">
        <button
          class="w-full rounded px-3 py-2 text-left hover:bg-accent"
          type="button"
          role="menuitem"
          @click="openPermissionDialog(row, close)"
        >
          {{ uiText('Edit owner permissions') }}
        </button>
      </template>
    </ResourceList>

    <div
      v-if="permissionDialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
      role="presentation"
      @click.self="closePermissionDialog"
    >
      <div
        class="w-full max-w-3xl rounded-lg border bg-card p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        :aria-label="uiText('Edit owner permissions')"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-semibold">
              {{ uiText('Edit owner permissions') }}
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              {{ selectedClientName }}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            :disabled="permissionSaving"
            @click="closePermissionDialog"
          >
            {{ uiText('Close') }}
          </Button>
        </div>

        <div class="mt-5 max-h-[60vh] overflow-auto rounded-md border p-2">
          <div
            v-if="permissionDialogLoading"
            class="grid gap-2"
          >
            <div
              v-for="index in 8"
              :key="`owner-permission-skeleton-${index}`"
              class="flex items-start gap-2 rounded-md px-2 py-1"
            >
              <div class="mt-1 h-4 w-4 rounded-sm bg-muted animate-pulse" />
              <div class="grid gap-1">
                <div class="h-4 w-36 rounded bg-muted animate-pulse" />
                <div class="h-3 w-56 rounded bg-muted/70 animate-pulse" />
              </div>
            </div>
          </div>
          <div
            v-else-if="availablePermissions.length === 0"
            class="px-2 py-8 text-center text-sm text-muted-foreground"
          >
            {{ uiText('No permissions available.') }}
          </div>
          <div
            v-else
            class="grid gap-2"
          >
            <label
              v-for="permission in availablePermissions"
              :key="permission.id"
              class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-accent"
            >
              <input
                :checked="selectedPermissionIds.includes(permission.id)"
                class="mt-1 h-4 w-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                type="checkbox"
                :disabled="permissionSaving"
                @change="togglePermission(permission.id)"
              >
              <div class="grid">
                <span class="text-sm font-medium">
                  {{ permission.name }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ permission.description || '-' }}
                </span>
              </div>
            </label>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="permissionSaving"
            @click="closePermissionDialog"
          >
            {{ uiText('Cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="permissionSaving || permissionDialogLoading"
            @click="saveOwnerPermissions"
          >
            {{ permissionSaving ? uiText('Saving...') : uiText('Save Changes') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
