import { computed, reactive, ref, watch, type ComputedRef } from 'vue'
import { fetchPermissionsByQuery } from './role-permissions'
import type { createRolesApi } from './roles-api'
import {
  buildRoleUpdatePayload,
  extractPermissionItemsFromRow,
  mergePermissionsById,
  toggleId,
} from './roles-format'
import type { PermissionItem, RoleEditForm } from './types'
import { useDebouncedQuery } from './use-debounced-query'

type RolesApi = ReturnType<typeof createRolesApi>

type UseRoleEditFlowOptions = {
  rolesApi: RolesApi
  basePermissions: ComputedRef<PermissionItem[]>
  searchDebounceMs: number
  show: (message: string, variant: 'success' | 'error') => void
  t: (key: string) => string
  ensureBasePermissions: () => void
}

export const useRoleEditFlow = ({
  rolesApi,
  basePermissions,
  searchDebounceMs,
  show,
  t,
  ensureBasePermissions,
}: UseRoleEditFlowOptions) => {
  const loading = ref(false)
  const form = reactive<RoleEditForm>({
    id: '',
    permissionIds: [],
  })
  const permissionResults = ref<PermissionItem[]>([])
  const permissionItems = ref<PermissionItem[]>([])
  const permissionQuery = useDebouncedQuery(searchDebounceMs)

  const permissionOptions = computed(() => mergePermissionsById(
    basePermissions.value,
    permissionResults.value,
    permissionItems.value,
  ))
  const permissionSearchOptions = computed(() => (
    permissionQuery.query.value.trim()
      ? mergePermissionsById(permissionResults.value, permissionItems.value)
      : permissionOptions.value
  ))
  const filteredPermissions = computed(() => (
    permissionQuery.query.value.trim()
      ? permissionSearchOptions.value
      : permissionOptions.value
  ))

  watch(
    () => permissionQuery.query.value,
    async (value) => {
      if (!value.trim()) {
        permissionResults.value = []
        return
      }
      permissionResults.value = await fetchPermissionsByQuery(rolesApi, value)
    },
  )

  const reset = () => {
    loading.value = false
    form.id = ''
    form.permissionIds = []
    permissionItems.value = []
    permissionQuery.reset()
    permissionResults.value = []
  }

  const close = (closeDialog: () => void) => {
    reset()
    closeDialog()
  }

  const togglePermission = (id: string) => {
    form.permissionIds = toggleId(form.permissionIds, id)
  }

  const syncForm = (row: Record<string, unknown> | null) => {
    if (!row) {
      return false
    }

    const id = typeof row.id === 'string' ? row.id : String(row.id ?? '')
    if (!id || form.id === id) {
      return true
    }

    const items = extractPermissionItemsFromRow(row)
    form.id = id
    permissionItems.value = items
    form.permissionIds = items.map((item) => item.id)
    permissionQuery.reset()
    if (!basePermissions.value.length) {
      ensureBasePermissions()
    }
    return true
  }

  const submit = async (closeDialog: () => void, refreshList: () => Promise<void>) => {
    if (!form.id) {
      show(t('ui.roleIdIsMissing'), 'error')
      return
    }

    loading.value = true
    const payload = buildRoleUpdatePayload(form.permissionIds)
    let response

    try {
      response = await rolesApi.updateRolePermissions(form.id, payload.permission_ids)
    }
    finally {
      loading.value = false
    }

    if (response.success) {
      show(t('ui.roleUpdated'), 'success')
      await refreshList()
      close(closeDialog)
    }
  }

  return {
    loading,
    form,
    permissionQueryInput: permissionQuery.input,
    filteredPermissions,
    reset,
    close,
    togglePermission,
    syncForm,
    submit,
  }
}
