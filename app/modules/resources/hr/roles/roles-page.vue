<script setup lang="ts">
import AdminInviteDialog from './components/admin-invite-dialog.vue'
import PermissionsTableCard from './components/permissions-table-card.vue'
import RoleCreateDialog from './components/role-create-dialog.vue'
import RoleEditPermissionsDialog from './components/role-edit-permissions-dialog.vue'
import { formatRoleDeleteLabel, formatRolePermissionCount } from './roles-format'
import { useRolesManager } from './use-roles-manager'

defineOptions({ name: 'RolesPage' })
const { t } = useLocale()

const columns = [
  { key: 'name', label: 'Name' },
  {
    key: 'permissions',
    label: 'Permissions',
    format: formatRolePermissionCount,
  },
]

const manager = useRolesManager()
const {
  listKey,
  createOpen,
  createLoading,
  editLoading,
  permissionListQueryInput,
  createPermissionQueryInput,
  createPermissionQuery,
  createPermissionsLoading,
  createForm,
  editForm,
  editPermissionQueryInput,
  adminInviteOpen,
  adminInviteLoading,
  adminInviteEmail,
  adminInviteResult,
  canInviteAdmins,
  pending,
  error,
  permissions,
  permissionCurrentPage,
  permissionLastPage,
  permissionSkeletonRows,
  filteredPermissions,
  createPermissionSkeletonRows,
  createPermissionCurrentPage,
  createPermissionLastPage,
  filteredEditPermissions,
  resetCreate,
  openCreate,
  handleEditClose,
  togglePermission,
  toggleEditPermission,
  submitCreate,
  syncEditForm,
  submitUpdate,
  nextPermissionPage,
  prevPermissionPage,
  nextCreatePermissionPage,
  prevCreatePermissionPage,
  openAdminInvite,
  closeAdminInvite,
  adminInvitationLink,
  formatInvitationDateTime,
  copyToClipboard,
  submitAdminInvite,
} = manager
</script>

<template>
  <div class="space-y-6">
    <ResourceList
      :key="listKey"
      :title="t('ui.roles')"
      endpoint="/role-and-permissions/roles"
      :columns="columns"
      :search-debounce-ms="1000"
      loading-variant="skeleton"
      :delete-label-formatter="formatRoleDeleteLabel"
    >
      <template #header-actions>
        <Button
          size="sm"
          @click="openCreate"
        >
          {{ t('ui.addNew') }}
        </Button>
        <Button
          v-if="canInviteAdmins"
          size="sm"
          variant="outline"
          @click="openAdminInvite"
        >
          {{ t('ui.inviteAdmin') }}
        </Button>
      </template>
      <template #detail="{ row, loading, close, refresh: refreshList }">
        <RoleEditPermissionsDialog
          v-if="syncEditForm(row)"
          v-model:permission-query="editPermissionQueryInput"
          :loading="loading"
          :saving="editLoading"
          :permissions="filteredEditPermissions"
          :selected-permission-ids="editForm.permissionIds"
          @close="handleEditClose(close)"
          @save="submitUpdate(close, refreshList)"
          @toggle-permission="toggleEditPermission"
        />
      </template>
    </ResourceList>

    <PermissionsTableCard
      v-model:query="permissionListQueryInput"
      :error="error"
      :pending="pending"
      :permissions="permissions"
      :skeleton-rows="permissionSkeletonRows"
      :current-page="permissionCurrentPage"
      :last-page="permissionLastPage"
      @next-page="nextPermissionPage"
      @previous-page="prevPermissionPage"
    />
  </div>

  <AdminInviteDialog
    v-model:email="adminInviteEmail"
    :open="adminInviteOpen"
    :loading="adminInviteLoading"
    :result="adminInviteResult"
    :invitation-link="adminInvitationLink"
    :format-expires-at="formatInvitationDateTime"
    @close="closeAdminInvite"
    @copy="copyToClipboard"
    @submit="submitAdminInvite"
  />

  <RoleCreateDialog
    v-model:role-name="createForm.name"
    v-model:permission-query="createPermissionQueryInput"
    :open="createOpen"
    :loading="createLoading"
    :selected-permission-ids="createForm.permissionIds"
    :permissions="filteredPermissions"
    :permissions-loading="createPermissionsLoading"
    :permission-skeleton-rows="createPermissionSkeletonRows"
    :show-pagination="!createPermissionQuery"
    :current-page="createPermissionCurrentPage"
    :last-page="createPermissionLastPage"
    @close="resetCreate"
    @next-page="nextCreatePermissionPage"
    @previous-page="prevCreatePermissionPage"
    @submit="submitCreate"
    @toggle-permission="togglePermission"
  />
</template>
