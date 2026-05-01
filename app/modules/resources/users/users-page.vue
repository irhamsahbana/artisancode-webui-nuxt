<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import {
  buildUserPayload,
  createEmptyUserForm,
  formatUserRoles,
  syncUserForm,
  type RoleItem,
  type UserDetail,
} from './users-form'

defineOptions({ name: 'UsersPage' })

const { apiFetch } = useApi()
const { show } = useBanner()
const { locale, t } = useLocale()

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  {
    key: 'roles',
    label: 'Roles',
    format: formatUserRoles,
  },
]

const refreshKey = ref(0)
const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalLoading = ref(false)
const submitLoading = ref(false)
const rolesLoading = ref(false)
const roles = ref<RoleItem[]>([])

const form = ref(createEmptyUserForm())

const resetForm = () => {
  form.value = createEmptyUserForm()
}

const triggerRefresh = () => {
  refreshKey.value += 1
}

const selectedRoleNames = computed(() => {
  return roles.value
    .filter(role => form.value.role_ids.includes(role.id))
    .map(role => role.name)
})

const loadRoles = async () => {
  rolesLoading.value = true

  try {
    const response = await apiFetch<{ items: RoleItem[] }>('/role-and-permissions/roles', {
      query: {
        page: 1,
        limit: 100,
      },
    })

    if (!response.success || !response.data) {
      roles.value = []
      return
    }

    roles.value = response.data.items
  }
  finally {
    rolesLoading.value = false
  }
}

const openCreateModal = async () => {
  resetForm()
  modalMode.value = 'create'
  modalOpen.value = true
  await loadRoles()
}

const openEditModal = async (row: Record<string, unknown>) => {
  resetForm()
  modalMode.value = 'edit'
  modalOpen.value = true
  modalLoading.value = true

  try {
    await loadRoles()

    const id = String(row.id ?? '')
    const response = await apiFetch<UserDetail>(`/users/${id}`)
    if (response.success && response.data) {
      syncUserForm(form.value, response.data)
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

const toggleRole = (roleId: string) => {
  if (form.value.role_ids.includes(roleId)) {
    form.value.role_ids = form.value.role_ids.filter(id => id !== roleId)
    return
  }
  form.value.role_ids = [...form.value.role_ids, roleId]
}

const validateForm = () => {
  if (!form.value.name.trim()) {
    show(t('ui.nameIsRequired'), 'error')
    return false
  }
  if (!form.value.username.trim()) {
    show(t('ui.usernameIsRequired'), 'error')
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
  if (form.value.role_ids.length === 0) {
    show(t('ui.selectAtLeastOneRole'), 'error')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitLoading.value = true

  try {
    if (modalMode.value === 'create') {
      const response = await apiFetch('/users', {
        method: 'POST',
        body: buildUserPayload(form.value),
      })
      if (response.success) {
        show(t('ui.userCreatedSuccessfully'), 'success')
        closeModal()
        triggerRefresh()
      }
    }
    else {
      const response = await apiFetch(`/users/${form.value.id}`, {
        method: 'PUT',
        body: buildUserPayload(form.value),
      })
      if (response.success) {
        show(t('ui.userUpdatedSuccessfully'), 'success')
        closeModal()
        triggerRefresh()
      }
    }
  }
  finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="t('ui.users')"
    endpoint="/users"
    :columns="columns"
    loading-variant="skeleton"
    :can-view-detail="false"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #header-actions>
      <Button
        size="sm"
        @click="openCreateModal"
      >
        {{ t('ui.addNew') }}
      </Button>
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

  <div
    v-if="modalOpen"
  >
    <FormDialogShell
      max-width-class="max-w-2xl"
      :title="modalMode === 'create' ? t('ui.addUser') : t('ui.editUser')"
      :description="t('ui.manageAccountDetailsAndRoleAssignmentsInOnePlace')"
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
        @submit.prevent="handleSubmit"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="user-name">Name</Label>
            <Input
              id="user-name"
              v-model="form.name"
              placeholder="Full name"
            />
          </div>

          <div class="space-y-2">
            <Label for="user-username">Username</Label>
            <Input
              id="user-username"
              v-model="form.username"
              placeholder="username"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="user-email">Email</Label>
            <Input
              id="user-email"
              v-model="form.email"
              type="email"
              placeholder="user@company.com"
            />
          </div>

          <div class="space-y-2">
            <Label for="user-password">
              {{ modalMode === 'create' ? t('ui.password') : t('ui.resetPasswordOptional') }}
            </Label>
            <Input
              id="user-password"
              v-model="form.password"
              type="password"
              :placeholder="modalMode === 'create' ? t('ui.minimum8Characters') : t('ui.leaveBlankToKeepCurrentPassword')"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ t('ui.roles') }}</Label>
          <div
            class="rounded-md border p-4"
          >
            <div
              v-if="rolesLoading"
              class="text-sm text-muted-foreground"
            >
              {{ t('ui.loadingRoles') }}
            </div>
            <div
              v-else-if="roles.length === 0"
              class="text-sm text-muted-foreground"
            >
              {{ t('ui.noRolesAvailable') }}
            </div>
            <div
              v-else
              class="grid gap-2 md:grid-cols-2"
            >
              <label
                v-for="role in roles"
                :key="role.id"
                class="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <input
                  :checked="form.role_ids.includes(role.id)"
                  type="checkbox"
                  class="h-4 w-4"
                  @change="toggleRole(role.id)"
                >
                <span>{{ role.name }}</span>
              </label>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t('ui.selectedRoles') }}: {{ selectedRoleNames.length > 0 ? selectedRoleNames.join(', ') : t('ui.none') }}
          </p>
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
            {{ submitLoading ? t('ui.saving') : (modalMode === 'create' ? t('ui.createUser') : t('ui.saveChanges')) }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>
</template>
