<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import InternalResourceFilterPanel from '../internal-resource-filter-panel.vue'
import { useBanner } from '~/composables/useBanner'
import { useDateTime } from '~/composables/useDateTime'
import { useApi } from '~/composables/useApi'
import {
  buildInternalUserPayload,
  createEmptyInternalUserForm,
  roleOptionList,
  statusOptionList,
  syncInternalUserForm,
  type InternalUser,
} from './internal-users-form'

defineOptions({ name: 'InternalUsersPage' })

const { apiFetch } = useApi()
const { show } = useBanner()
const { t } = useLocale()
const { formatDateTime } = useDateTime()

const columns = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'role_code', label: 'Role' },
  { key: 'status', label: 'Status' },
  {
    key: 'last_login_at',
    label: 'Last Login',
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
]

const refreshKey = ref(0)
const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalLoading = ref(false)
const submitLoading = ref(false)
const filterPanelOpen = ref(false)
const filters = reactive({
  role_code: '',
  status: '',
})

const listQuery = computed(() => {
  const query: Record<string, string> = {}
  if (filters.role_code) {
    query.role_code = filters.role_code
  }
  if (filters.status) {
    query.status = filters.status
  }
  return query
})

const form = ref(createEmptyInternalUserForm())

const resetForm = () => {
  form.value = createEmptyInternalUserForm()
}

const triggerRefresh = () => {
  refreshKey.value += 1
}

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const fullName = row.full_name
  const email = row.email

  if (typeof fullName === 'string' && fullName.length > 0 && typeof email === 'string' && email.length > 0) {
    return `${fullName} (${email})`
  }

  return typeof fullName === 'string' && fullName.length > 0 ? fullName : String(row.id ?? '-')
}

const openCreateModal = () => {
  resetForm()
  modalMode.value = 'create'
  modalOpen.value = true
}

const openEditModal = async (row: Record<string, unknown>) => {
  resetForm()
  modalMode.value = 'edit'
  modalOpen.value = true
  modalLoading.value = true

  try {
    const id = String(row.id ?? '')
    const response = await apiFetch<InternalUser>(`/internal-users/${id}`, {
      authMode: 'internal',
    })

    if (response.success && response.data) {
      syncInternalUserForm(form.value, response.data)
    }
  }
  finally {
    modalLoading.value = false
  }
}

const closeModal = () => {
  modalOpen.value = false
  modalLoading.value = false
  submitLoading.value = false
  resetForm()
}

const validateForm = () => {
  if (!form.value.full_name.trim()) {
    show(t('ui.fullNameIsRequired'), 'error')
    return false
  }

  if (!form.value.email.trim()) {
    show(t('ui.emailIsRequired'), 'error')
    return false
  }

  if (modalMode.value === 'create' && form.value.password.trim().length < 8) {
    show(t('ui.passwordMustBeAtLeast8Characters'), 'error')
    return false
  }

  if (modalMode.value === 'edit' && form.value.password.trim().length > 0 && form.value.password.trim().length < 8) {
    show(t('ui.passwordMustBeAtLeast8Characters'), 'error')
    return false
  }

  return true
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  submitLoading.value = true

  try {
    const response = modalMode.value === 'create'
      ? await apiFetch('/internal-users', {
          method: 'POST',
          body: buildInternalUserPayload(form.value),
          authMode: 'internal',
        })
      : await apiFetch(`/internal-users/${form.value.id}`, {
          method: 'PUT',
          body: buildInternalUserPayload(form.value),
          authMode: 'internal',
        })

    if (!response.success) {
      return
    }

    show(
      modalMode.value === 'create'
        ? t('ui.userCreatedSuccessfully')
        : t('ui.userUpdatedSuccessfully'),
      'success',
    )
    closeModal()
    triggerRefresh()
  }
  finally {
    submitLoading.value = false
  }
}

const modalTitle = computed(() => (
  modalMode.value === 'create'
    ? t('ui.addUser')
    : t('ui.editUser')
))

const clearFilters = () => {
  filters.role_code = ''
  filters.status = ''
}

const toggleFilterPanel = () => {
  filterPanelOpen.value = !filterPanelOpen.value
}
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="t('ui.users')"
    endpoint="/internal-users"
    :columns="columns"
    :extra-query="listQuery"
    loading-variant="skeleton"
    :search-placeholder="t('ui.searchUsers')"
    :show-search-filter-trigger="true"
    :search-filter-open="filterPanelOpen"
    :can-view-detail="false"
    auth-mode="internal"
    :delete-label-formatter="deleteLabelFormatter"
    @search-filter-trigger="toggleFilterPanel"
  >
    <template #filters>
      <InternalResourceFilterPanel
        v-model:open="filterPanelOpen"
        @clear="clearFilters"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="internal-user-role-filter">{{ t('ui.role') }}</Label>
            <SearchableSelect
              id="internal-user-role-filter"
              v-model="filters.role_code"
              :options="[{ value: '', label: t('ui.allRoles') }, ...roleOptionList]"
              :placeholder="t('ui.allRoles')"
              :search-placeholder="t('ui.searchRole')"
            />
          </div>

          <div class="space-y-2">
            <Label for="internal-user-status-filter">{{ t('ui.status') }}</Label>
            <SearchableSelect
              id="internal-user-status-filter"
              v-model="filters.status"
              :options="[{ value: '', label: t('ui.allStatuses') }, ...statusOptionList]"
              :placeholder="t('ui.allStatuses')"
              :search-placeholder="t('ui.searchStatus')"
            />
          </div>
        </div>
      </InternalResourceFilterPanel>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ t('ui.edit') }}
      </button>
    </template>
  </ResourceList>

  <div v-if="modalOpen">
    <FormDialogShell
      max-width-class="max-w-2xl"
      :title="modalTitle"
      :description="t('ui.manageUserAccessAndAccountStatus')"
      @close="closeModal"
    >
      <div
        v-if="modalLoading"
        class="text-sm text-muted-foreground"
      >
        {{ t('ui.loadingUserData') }}
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="submitForm"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="internal-user-full-name">{{ t('ui.fullName') }}</Label>
            <Input
              id="internal-user-full-name"
              v-model="form.full_name"
              :placeholder="t('ui.fullName2')"
            />
          </div>

          <div class="space-y-2">
            <Label for="internal-user-email">{{ t('ui.email') }}</Label>
            <Input
              id="internal-user-email"
              v-model="form.email"
              type="email"
              placeholder="admin@company.com"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <Label for="internal-user-role">{{ t('ui.role') }}</Label>
            <SearchableSelect
              id="internal-user-role"
              v-model="form.role_code"
              :options="roleOptionList"
              :placeholder="t('ui.selectRole')"
              :search-placeholder="t('ui.searchRole')"
            />
          </div>

          <div class="space-y-2">
            <Label for="internal-user-status">{{ t('ui.status') }}</Label>
            <SearchableSelect
              id="internal-user-status"
              v-model="form.status"
              :options="statusOptionList"
              :placeholder="t('ui.selectStatus')"
              :search-placeholder="t('ui.searchStatus')"
            />
          </div>

          <div class="space-y-2">
            <Label for="internal-user-password">
              {{ modalMode === 'create' ? t('ui.password') : t('ui.resetPasswordOptional') }}
            </Label>
            <Input
              id="internal-user-password"
              v-model="form.password"
              type="password"
              :placeholder="modalMode === 'create' ? t('ui.minimum8Characters') : t('ui.leaveBlankToKeepCurrentPassword')"
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            class="rounded-xl"
            @click="closeModal"
          >
            {{ t('ui.cancel') }}
          </Button>
          <Button
            type="submit"
            class="rounded-xl"
            :disabled="submitLoading"
          >
            {{ submitLoading ? t('ui.saving') : modalTitle }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>
</template>
