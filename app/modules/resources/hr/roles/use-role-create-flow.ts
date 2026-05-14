import { computed, reactive, ref, watch } from 'vue'
import type { PaginationMeta } from '~/types/api'
import { fetchPermissionsByQuery } from './role-permissions'
import { DEFAULT_PERMISSION_PAGE_LIMIT } from './roles-config.js'
import type { createRolesApi } from './roles-api'
import { buildRoleCreatePayload, toggleId } from './roles-format'
import type { PermissionItem, RoleCreateForm } from './types'
import { useDebouncedQuery } from './use-debounced-query'

type RolesApi = ReturnType<typeof createRolesApi>

type UseRoleCreateFlowOptions = {
  rolesApi: RolesApi
  searchDebounceMs: number
  show: (message: string, variant: 'success' | 'error') => void
  t: (key: string) => string
  onCreated: () => void
}

export const useRoleCreateFlow = ({
  rolesApi,
  searchDebounceMs,
  show,
  t,
  onCreated,
}: UseRoleCreateFlowOptions) => {
  const open = ref(false)
  const loading = ref(false)
  const permissionQuery = useDebouncedQuery(searchDebounceMs)
  const permissionPage = ref(1)
  const permissionLimit = ref(DEFAULT_PERMISSION_PAGE_LIMIT)
  const permissionPagination = ref<PaginationMeta | null>(null)
  const permissionsLoading = ref(false)
  const permissionResults = ref<PermissionItem[]>([])
  const permissions = ref<PermissionItem[]>([])
  const form = reactive<RoleCreateForm>({
    name: '',
    permissionIds: [],
  })

  const filteredPermissions = computed(() => (
    permissionQuery.query.value.trim()
      ? permissionResults.value
      : permissions.value
  ))
  const permissionSkeletonRows = computed(() =>
    Math.max(1, Number(permissionLimit.value ?? 1)),
  )
  const permissionCurrentPage = computed(() =>
    permissionPagination.value?.page ?? permissionPage.value ?? 1,
  )
  const permissionLastPage = computed(() => permissionPagination.value?.last_page ?? 1)

  const loadPermissions = async () => {
    if (permissionQuery.query.value.trim()) {
      return
    }

    permissionsLoading.value = true
    let response

    try {
      response = await rolesApi.listPermissions({
        page: permissionPage.value,
        limit: permissionLimit.value,
      })
    }
    finally {
      permissionsLoading.value = false
    }

    if (!response.success || !response.data) {
      permissions.value = []
      permissionPagination.value = null
      return
    }

    permissions.value = response.data.items
    permissionPagination.value = response.data.pagination
  }

  watch(
    () => [permissionPage.value, permissionLimit.value],
    () => {
      if (!permissionQuery.query.value.trim()) {
        loadPermissions()
      }
    },
  )

  watch(
    () => permissionLimit.value,
    (value, previous) => {
      if (value !== previous) {
        permissionPage.value = 1
      }
    },
  )

  watch(
    () => permissionQuery.query.value,
    async (value) => {
      if (!value.trim()) {
        permissionResults.value = []
        await loadPermissions()
        return
      }
      permissionResults.value = await fetchPermissionsByQuery(rolesApi, value)
    },
  )

  const reset = () => {
    open.value = false
    loading.value = false
    form.name = ''
    form.permissionIds = []
    permissionQuery.reset()
    permissionResults.value = []
    permissions.value = []
    permissionPagination.value = null
  }

  const openDialog = async () => {
    if (!permissions.value.length) {
      await loadPermissions()
    }
    open.value = true
  }

  const togglePermission = (id: string) => {
    form.permissionIds = toggleId(form.permissionIds, id)
  }

  const submit = async () => {
    const payload = buildRoleCreatePayload(form.name, form.permissionIds)
    if (!payload.name) {
      show(t('ui.roleNameIsRequired'), 'error')
      return
    }

    loading.value = true
    let response

    try {
      response = await rolesApi.createRole(payload.name, form.permissionIds)
    }
    finally {
      loading.value = false
    }

    if (response.success) {
      show(t('ui.roleCreated'), 'success')
      reset()
      onCreated()
    }
  }

  const nextPermissionPage = () => {
    if (permissionPagination.value && permissionPage.value < permissionPagination.value.last_page) {
      permissionPage.value += 1
    }
  }

  const prevPermissionPage = () => {
    if (permissionPage.value > 1) {
      permissionPage.value -= 1
    }
  }

  return {
    open,
    loading,
    permissionQueryInput: permissionQuery.input,
    permissionQuery: permissionQuery.query,
    permissionPage,
    permissionsLoading,
    form,
    filteredPermissions,
    permissionSkeletonRows,
    permissionCurrentPage,
    permissionLastPage,
    reset,
    openDialog,
    togglePermission,
    submit,
    nextPermissionPage,
    prevPermissionPage,
  }
}
