<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import InternalResourceListControls from '../internal-resource-list-controls.vue'
import { useBanner } from '~/composables/useBanner'
import { useDateTime } from '~/composables/useDateTime'
import { useApi } from '~/composables/useApi'

defineOptions({ name: 'InternalUsersPage' })

type InternalUser = {
  id: string
  full_name: string
  email: string
  role_code: string
  status: string
  last_login_at: string | null
  created_at: string
  updated_at: string
}

const roleOptions = ['super_admin', 'operator'] as const
const statusOptions = ['invited', 'active', 'inactive'] as const
const roleOptionList = roleOptions.map((value) => ({ value, label: value }))
const statusOptionList = statusOptions.map((value) => ({ value, label: value }))

const { apiFetch } = useApi()
const { show } = useBanner()
const { text: uiText } = useLocale()
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

const activeFilterCount = computed(() => Object.keys(listQuery.value).length)

const form = ref({
  id: '',
  full_name: '',
  email: '',
  password: '',
  role_code: 'operator',
  status: 'active',
})

const resetForm = () => {
  form.value = {
    id: '',
    full_name: '',
    email: '',
    password: '',
    role_code: 'operator',
    status: 'active',
  }
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

  const id = String(row.id ?? '')
  const response = await apiFetch<InternalUser>(`/internal-users/${id}`, {
    authMode: 'internal',
  })

  if (response.success && response.data) {
    form.value.id = response.data.id
    form.value.full_name = response.data.full_name
    form.value.email = response.data.email
    form.value.role_code = roleOptions.includes(response.data.role_code as (typeof roleOptions)[number])
      ? response.data.role_code
      : 'operator'
    form.value.status = statusOptions.includes(response.data.status as (typeof statusOptions)[number])
      ? response.data.status
      : 'active'
  }

  modalLoading.value = false
}

const closeModal = () => {
  modalOpen.value = false
  modalLoading.value = false
  submitLoading.value = false
  resetForm()
}

const buildPayload = () => {
  const payload: Record<string, unknown> = {
    full_name: form.value.full_name.trim(),
    email: form.value.email.trim(),
    role_code: form.value.role_code,
    status: form.value.status,
  }

  const password = form.value.password.trim()
  if (password.length > 0) {
    payload.password = password
  }

  return payload
}

const validateForm = () => {
  if (!form.value.full_name.trim()) {
    show(uiText('Full name is required'), 'error')
    return false
  }

  if (!form.value.email.trim()) {
    show(uiText('Email is required'), 'error')
    return false
  }

  if (modalMode.value === 'create' && form.value.password.trim().length < 8) {
    show(uiText('Password must be at least 8 characters'), 'error')
    return false
  }

  if (modalMode.value === 'edit' && form.value.password.trim().length > 0 && form.value.password.trim().length < 8) {
    show(uiText('Password must be at least 8 characters'), 'error')
    return false
  }

  return true
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  submitLoading.value = true

  const response = modalMode.value === 'create'
    ? await apiFetch('/internal-users', {
        method: 'POST',
        body: buildPayload(),
        authMode: 'internal',
      })
    : await apiFetch(`/internal-users/${form.value.id}`, {
        method: 'PUT',
        body: buildPayload(),
        authMode: 'internal',
      })

  submitLoading.value = false

  if (!response.success) {
    return
  }

  show(
    modalMode.value === 'create'
      ? uiText('User created successfully')
      : uiText('User updated successfully'),
    'success',
  )
  closeModal()
  triggerRefresh()
}

const modalTitle = computed(() => (
  modalMode.value === 'create'
    ? uiText('Add User')
    : uiText('Edit User')
))

const clearFilters = () => {
  filters.role_code = ''
  filters.status = ''
}
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="uiText('Users')"
    endpoint="/internal-users"
    :columns="columns"
    :extra-query="listQuery"
    loading-variant="skeleton"
    :can-view-detail="false"
    auth-mode="internal"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #header-actions>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <InternalResourceListControls
          endpoint="/internal-users"
          resource-key="internal-users"
          filename-prefix="internal-users"
          :columns="columns"
          :query="listQuery"
          :filter-count="activeFilterCount"
          @reset="clearFilters"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="internal-user-role-filter">{{ uiText('Role') }}</Label>
              <SearchableSelect
                id="internal-user-role-filter"
                v-model="filters.role_code"
                :options="[{ value: '', label: uiText('All roles') }, ...roleOptionList]"
                :placeholder="uiText('All roles')"
                :search-placeholder="uiText('Search role...')"
              />
            </div>

            <div class="space-y-2">
              <Label for="internal-user-status-filter">{{ uiText('Status') }}</Label>
              <SearchableSelect
                id="internal-user-status-filter"
                v-model="filters.status"
                :options="[{ value: '', label: uiText('All statuses') }, ...statusOptionList]"
                :placeholder="uiText('All statuses')"
                :search-placeholder="uiText('Search status...')"
              />
            </div>
          </div>
        </InternalResourceListControls>

        <Button
          size="sm"
          class="rounded-xl"
          @click="openCreateModal"
        >
          {{ uiText('Add New') }}
        </Button>
      </div>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ uiText('Edit') }}
      </button>
    </template>
  </ResourceList>

  <div v-if="modalOpen">
    <FormDialogShell
      max-width-class="max-w-2xl"
      :title="modalTitle"
      :description="uiText('Manage user access and account status.')"
      @close="closeModal"
    >
      <div
        v-if="modalLoading"
        class="text-sm text-muted-foreground"
      >
        {{ uiText('Loading user data...') }}
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="submitForm"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="internal-user-full-name">{{ uiText('Full Name') }}</Label>
            <Input
              id="internal-user-full-name"
              v-model="form.full_name"
              :placeholder="uiText('Full name')"
            />
          </div>

          <div class="space-y-2">
            <Label for="internal-user-email">{{ uiText('Email') }}</Label>
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
            <Label for="internal-user-role">{{ uiText('Role') }}</Label>
            <SearchableSelect
              id="internal-user-role"
              v-model="form.role_code"
              :options="roleOptionList"
              :placeholder="uiText('Select role')"
              :search-placeholder="uiText('Search role...')"
            />
          </div>

          <div class="space-y-2">
            <Label for="internal-user-status">{{ uiText('Status') }}</Label>
            <SearchableSelect
              id="internal-user-status"
              v-model="form.status"
              :options="statusOptionList"
              :placeholder="uiText('Select status')"
              :search-placeholder="uiText('Search status...')"
            />
          </div>

          <div class="space-y-2">
            <Label for="internal-user-password">
              {{ modalMode === 'create' ? uiText('Password') : uiText('Reset Password (Optional)') }}
            </Label>
            <Input
              id="internal-user-password"
              v-model="form.password"
              type="password"
              :placeholder="modalMode === 'create' ? uiText('Minimum 8 characters') : uiText('Leave blank to keep current password')"
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
            {{ uiText('Cancel') }}
          </Button>
          <Button
            type="submit"
            class="rounded-xl"
            :disabled="submitLoading"
          >
            {{ submitLoading ? uiText('Saving...') : modalTitle }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>
</template>
