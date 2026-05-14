<script setup lang="ts">
import EmployeeAccessDialog from './employee-access-dialog.vue'
import EmployeeManageDialog from './employee-manage-dialog.vue'
import { useEmployeesPage } from './use-employees-page'

defineOptions({ name: 'EmployeesPage' })

const { t } = useLocale()
const {
  canInviteEmployee,
  closeInviteModal,
  closeModal,
  columns,
  copyToClipboard,
  deleteLabelFormatter,
  form,
  formatInvitationDateTime,
  handlePrimaryInviteAction,
  handleRevokeInvitation,
  handleSubmit,
  hasPendingInvitation,
  invitationLink,
  invitationMessage,
  inviteEmailSent,
  inviteEmployee,
  inviteLoading,
  inviteMetaLoading,
  inviteModalOpen,
  invitePrimaryActionLabel,
  inviteResult,
  inviteSource,
  inviteSummary,
  jobPositionOptions,
  modalLoading,
  modalMode,
  modalOpen,
  openCreateModal,
  openEditModal,
  openInviteModal,
  openManageInviteModal,
  orgUnits,
  refreshKey,
  showManualInviteFallback,
  statusOptions,
  submitLoading,
  workLocationOptions,
  workShiftOptions,
} = useEmployeesPage()
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="t('ui.employees')"
    endpoint="/employees"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
    :can-view-detail="false"
  >
    <template #header-actions>
      <Button
        size="sm"
        class="rounded-xl"
        @click="openCreateModal"
      >
        {{ t('ui.addNew') }}
      </Button>
    </template>

    <template #row-actions="{ row, close }">
      <button
        v-if="canInviteEmployee(row)"
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openInviteModal(row)"
      >
        {{ t('ui.sendAccess') }}
      </button>
      <button
        v-if="hasPendingInvitation(row)"
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openManageInviteModal(row)"
      >
        {{ t('ui.manageAccess') }}
      </button>
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ t('ui.edit') }}
      </button>
    </template>
  </ResourceList>

  <EmployeeManageDialog
    v-model:form="form"
    :open="modalOpen"
    :mode="modalMode"
    :loading="modalLoading"
    :saving="submitLoading"
    :org-units="orgUnits"
    :job-position-options="jobPositionOptions"
    :work-location-options="workLocationOptions"
    :work-shift-options="workShiftOptions"
    :status-options="statusOptions"
    @close="closeModal"
    @submit="handleSubmit"
  />

  <EmployeeAccessDialog
    :open="inviteModalOpen"
    :loading="inviteLoading"
    :meta-loading="inviteMetaLoading"
    :employee="inviteEmployee"
    :result="inviteResult"
    :summary="inviteSummary"
    :source="inviteSource"
    :invitation-link="invitationLink"
    :invitation-message="invitationMessage"
    :invite-email-sent="inviteEmailSent"
    :show-manual-invite-fallback="showManualInviteFallback"
    :primary-action-label="invitePrimaryActionLabel"
    :format-invitation-date-time="formatInvitationDateTime"
    @close="closeInviteModal"
    @copy="copyToClipboard"
    @primary-action="handlePrimaryInviteAction"
    @revoke="handleRevokeInvitation"
  />
</template>
