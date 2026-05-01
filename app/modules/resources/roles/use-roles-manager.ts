import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { PERMISSION_SEARCH_DEBOUNCE_MS } from './roles-config.js'
import { createRolesApi } from './roles-api'
import { useAdminInviteFlow } from './use-admin-invite-flow'
import { useRolePermissionList } from './use-role-permission-list'
import { useRoleCreateFlow } from './use-role-create-flow'
import { useRoleEditFlow } from './use-role-edit-flow'

export const useRolesManager = () => {
  const { apiFetch } = useApi()
  const rolesApi = createRolesApi(apiFetch)
  const { show } = useBanner()
  const { user } = useAuth()
  const { t } = useLocale()
  const { formatReadableDateTime } = useDateTime()

  const appOrigin = computed(() => (import.meta.client ? window.location.origin : ''))
  const listKey = ref(0)
  const permissionList = useRolePermissionList({
    rolesApi,
    searchDebounceMs: PERMISSION_SEARCH_DEBOUNCE_MS,
  })
  const createFlow = useRoleCreateFlow({
    rolesApi,
    searchDebounceMs: PERMISSION_SEARCH_DEBOUNCE_MS,
    show,
    t,
    onCreated: () => {
      listKey.value += 1
    },
  })
  const editFlow = useRoleEditFlow({
    rolesApi,
    basePermissions: computed(() => permissionList.permissions.value),
    searchDebounceMs: PERMISSION_SEARCH_DEBOUNCE_MS,
    show,
    t,
    ensureBasePermissions: () => {
      permissionList.refreshPermissions()
    },
  })
  const adminInvite = useAdminInviteFlow({
    appOrigin,
    rolesApi,
    show,
    t,
    formatReadableDateTime,
  })

  const canInviteAdmins = computed(() => {
    const roles = Array.isArray(user.value?.roles) ? user.value.roles : []
    return roles.includes('owner')
  })

  return {
    listKey,
    createOpen: createFlow.open,
    createLoading: createFlow.loading,
    editLoading: editFlow.loading,
    permissionListQueryInput: permissionList.permissionListQueryInput,
    permissionPage: permissionList.permissionPage,
    permissionLimit: permissionList.permissionLimit,
    createPermissionQueryInput: createFlow.permissionQueryInput,
    createPermissionQuery: createFlow.permissionQuery,
    createPermissionPage: createFlow.permissionPage,
    createPermissionsLoading: createFlow.permissionsLoading,
    createForm: createFlow.form,
    editForm: editFlow.form,
    editPermissionQueryInput: editFlow.permissionQueryInput,
    adminInviteOpen: adminInvite.open,
    adminInviteLoading: adminInvite.loading,
    adminInviteEmail: adminInvite.email,
    adminInviteResult: adminInvite.result,
    canInviteAdmins,
    pending: permissionList.pending,
    error: permissionList.error,
    permissions: permissionList.permissions,
    permissionCurrentPage: permissionList.permissionCurrentPage,
    permissionLastPage: permissionList.permissionLastPage,
    permissionSkeletonRows: permissionList.permissionSkeletonRows,
    filteredPermissions: createFlow.filteredPermissions,
    createPermissionSkeletonRows: createFlow.permissionSkeletonRows,
    createPermissionCurrentPage: createFlow.permissionCurrentPage,
    createPermissionLastPage: createFlow.permissionLastPage,
    filteredEditPermissions: editFlow.filteredPermissions,
    resetCreate: createFlow.reset,
    openCreate: createFlow.openDialog,
    handleEditClose: editFlow.close,
    togglePermission: createFlow.togglePermission,
    toggleEditPermission: editFlow.togglePermission,
    submitCreate: createFlow.submit,
    syncEditForm: editFlow.syncForm,
    submitUpdate: editFlow.submit,
    nextPermissionPage: permissionList.nextPermissionPage,
    prevPermissionPage: permissionList.prevPermissionPage,
    nextCreatePermissionPage: createFlow.nextPermissionPage,
    prevCreatePermissionPage: createFlow.prevPermissionPage,
    openAdminInvite: adminInvite.openDialog,
    closeAdminInvite: adminInvite.closeDialog,
    adminInvitationLink: adminInvite.invitationLink,
    formatInvitationDateTime: adminInvite.formatInvitationDateTime,
    copyToClipboard: adminInvite.copyToClipboard,
    submitAdminInvite: adminInvite.submit,
  }
}
