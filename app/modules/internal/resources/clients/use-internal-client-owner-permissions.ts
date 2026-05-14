import { computed, ref } from 'vue'

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

export const useInternalClientOwnerPermissions = () => {
  const { t } = useLocale()
  const { apiFetch } = useApi()
  const { show } = useBanner()

  const permissionDialogOpen = ref(false)
  const permissionDialogLoading = ref(false)
  const permissionSaving = ref(false)
  const selectedClient = ref<Record<string, unknown> | null>(null)
  const availablePermissions = ref<PermissionItem[]>([])
  const selectedPermissionIds = ref<string[]>([])

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
      show(t('ui.clientIdIsMissing'), 'error')
      return
    }

    selectedClient.value = row
    permissionDialogOpen.value = true
    permissionDialogLoading.value = true
    availablePermissions.value = []
    selectedPermissionIds.value = []

    try {
      const response = await apiFetch<OwnerPermissionsResponse>(`/internal-clients/${clientId}/owner-permissions`, {
        authMode: 'internal',
      })

      if (!response.success || !response.data) {
        return
      }

      availablePermissions.value = response.data.available_permissions
      selectedPermissionIds.value = response.data.owner_permission_ids
    }
    finally {
      permissionDialogLoading.value = false
    }
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
      show(t('ui.clientIdIsMissing'), 'error')
      return
    }

    permissionSaving.value = true

    try {
      const response = await apiFetch(`/internal-clients/${clientId}/owner-permissions`, {
        method: 'PUT',
        authMode: 'internal',
        body: {
          permission_ids: selectedPermissionIds.value,
        },
      })

      if (!response.success) {
        return
      }

      show(t('ui.ownerPermissionsUpdated'), 'success')
      closePermissionDialog()
    }
    finally {
      permissionSaving.value = false
    }
  }

  return {
    permissionDialogOpen,
    permissionDialogLoading,
    permissionSaving,
    selectedClient,
    selectedClientName,
    availablePermissions,
    selectedPermissionIds,
    openPermissionDialog,
    closePermissionDialog,
    togglePermission,
    saveOwnerPermissions,
  }
}
