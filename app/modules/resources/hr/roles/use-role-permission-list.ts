import { useAsyncData } from '#app'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ApiResponse, ListResponse } from '~/types/api'
import { DEFAULT_PERMISSION_PAGE_LIMIT, PERMISSIONS_ENDPOINT } from './roles-config.js'
import type { createRolesApi } from './roles-api'
import type { PermissionItem } from './types'
import { useDebouncedQuery } from './use-debounced-query'

type RolesApi = ReturnType<typeof createRolesApi>

type UseRolePermissionListOptions = {
  rolesApi: RolesApi
  searchDebounceMs: number
}

export const useRolePermissionList = ({
  rolesApi,
  searchDebounceMs,
}: UseRolePermissionListOptions) => {
  const permissionQuery = useDebouncedQuery(searchDebounceMs)
  const permissionPage = ref(1)
  const permissionLimit = ref(DEFAULT_PERMISSION_PAGE_LIMIT)
  const permissionsRequestController = ref<AbortController | null>(null)

  const { data, pending, error, refresh } = useAsyncData(
    PERMISSIONS_ENDPOINT,
    () => {
      permissionsRequestController.value?.abort()
      permissionsRequestController.value = import.meta.client ? new AbortController() : null
      return rolesApi.listPermissions({
        page: permissionPage.value,
        limit: permissionLimit.value,
        q: permissionQuery.query.value || undefined,
      }, permissionsRequestController.value?.signal)
    },
    { server: false },
  )

  const lastSuccessfulPermissionResponse = ref<
    ApiResponse<ListResponse<PermissionItem>> | undefined
  >(undefined)

  watch(
    () => data.value as ApiResponse<ListResponse<PermissionItem>> | undefined,
    (value) => {
      if (value?.success) {
        lastSuccessfulPermissionResponse.value = value
      }
    },
    { immediate: true },
  )

  const successfulPermissionResponse = computed(() => (
    (data.value as ApiResponse<ListResponse<PermissionItem>> | undefined)?.success
      ? data.value as ApiResponse<ListResponse<PermissionItem>> | undefined
      : lastSuccessfulPermissionResponse.value
  ))
  const permissions = computed(() => successfulPermissionResponse.value?.data?.items ?? [])
  const permissionPagination = computed(() => successfulPermissionResponse.value?.data?.pagination)
  const permissionCurrentPage = computed(() => permissionPagination.value?.page ?? permissionPage.value ?? 1)
  const permissionLastPage = computed(() => permissionPagination.value?.last_page ?? 1)
  const permissionSkeletonRows = computed(() => Math.max(1, Number(permissionLimit.value ?? 1)))

  watch(
    () => [permissionPage.value, permissionLimit.value, permissionQuery.query.value],
    () => refresh(),
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
    (value, previous) => {
      if (value !== previous) {
        permissionPage.value = 1
      }
    },
  )

  onBeforeUnmount(() => {
    permissionsRequestController.value?.abort()
  })

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
    permissionListQueryInput: permissionQuery.input,
    permissionPage,
    permissionLimit,
    pending,
    error,
    permissions,
    permissionCurrentPage,
    permissionLastPage,
    permissionSkeletonRows,
    refreshPermissions: refresh,
    nextPermissionPage,
    prevPermissionPage,
  }
}
