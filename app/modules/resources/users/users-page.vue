<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { localizeUiText } from '~/utils/ui-localization'

defineOptions({ name: 'UsersPage' })

type RoleItem = {
  id: string
  name: string
}

type UserRole = {
  id: string
  name: string
}

type UserDetail = {
  id: string
  name: string
  username: string
  email: string
  roles: UserRole[]
}

const { apiFetch } = useApi()
const { show } = useBanner()
const { locale } = useLocale()
const uiText = (value: string) => localizeUiText(locale.value, value)

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
    format: (value: unknown) => {
      const roles = Array.isArray(value) ? value as Array<{ name?: string }> : []
      if (roles.length === 0) {
        return '-'
      }
      return roles.map(role => role.name ?? '-').join(', ')
    },
  },
]

const refreshKey = ref(0)
const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalLoading = ref(false)
const submitLoading = ref(false)
const rolesLoading = ref(false)
const roles = ref<RoleItem[]>([])

const form = ref({
  id: '',
  name: '',
  username: '',
  email: '',
  password: '',
  role_ids: [] as string[],
})

const resetForm = () => {
  form.value = {
    id: '',
    name: '',
    username: '',
    email: '',
    password: '',
    role_ids: [],
  }
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
  const response = await apiFetch<{ items: RoleItem[] }>('/role-and-permissions/roles', {
    query: {
      page: 1,
      limit: 100,
    },
  })
  rolesLoading.value = false

  if (!response.success || !response.data) {
    roles.value = []
    return
  }

  roles.value = response.data.items
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

  await loadRoles()

  const id = String(row.id ?? '')
  const response = await apiFetch<UserDetail>(`/users/${id}`)
  if (response.success && response.data) {
    form.value.id = response.data.id
    form.value.name = response.data.name
    form.value.username = response.data.username
    form.value.email = response.data.email
    form.value.role_ids = response.data.roles.map(role => role.id)
  }

  modalLoading.value = false
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

const buildPayload = () => {
  const payload: Record<string, unknown> = {
    name: form.value.name.trim(),
    username: form.value.username.trim(),
    email: form.value.email.trim(),
    role_ids: form.value.role_ids,
  }

  const trimmedPassword = form.value.password.trim()
  if (trimmedPassword.length > 0) {
    payload.password = trimmedPassword
  }

  return payload
}

const validateForm = () => {
  if (!form.value.name.trim()) {
    show(uiText('Name is required'), 'error')
    return false
  }
  if (!form.value.username.trim()) {
    show(uiText('Username is required'), 'error')
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
  if (form.value.role_ids.length === 0) {
    show(uiText('Select at least one role'), 'error')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitLoading.value = true

  if (modalMode.value === 'create') {
    const response = await apiFetch('/users', {
      method: 'POST',
      body: buildPayload(),
    })
    if (response.success) {
      show(uiText('User created successfully'), 'success')
      closeModal()
      triggerRefresh()
    }
  }
  else {
    const response = await apiFetch(`/users/${form.value.id}`, {
      method: 'PUT',
      body: buildPayload(),
    })
    if (response.success) {
      show(uiText('User updated successfully'), 'success')
      closeModal()
      triggerRefresh()
    }
  }

  submitLoading.value = false
}
</script>

<template>
  <ResourceList
    :key="refreshKey"
    title="Users"
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
        + {{ uiText('Add User') }}
      </Button>
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

  <div
    v-if="modalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
    @click.self="closeModal"
  >
    <div class="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ modalMode === 'create' ? uiText('Add User') : uiText('Edit User') }}
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="closeModal"
        >
          {{ uiText('Close') }}
        </Button>
      </div>

      <div
        v-if="modalLoading"
        class="mt-6 text-sm text-muted-foreground"
      >
        {{ uiText('Loading user data...') }}
      </div>

      <form
        v-else
        class="mt-6 space-y-4"
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
              {{ modalMode === 'create' ? uiText('Password') : uiText('Reset Password (Optional)') }}
            </Label>
            <Input
              id="user-password"
              v-model="form.password"
              type="password"
              :placeholder="modalMode === 'create' ? uiText('Minimum 8 characters') : uiText('Leave blank to keep current password')"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ uiText('Roles') }}</Label>
          <div
            class="rounded-md border p-4"
          >
            <div
              v-if="rolesLoading"
              class="text-sm text-muted-foreground"
            >
              {{ uiText('Loading roles...') }}
            </div>
            <div
              v-else-if="roles.length === 0"
              class="text-sm text-muted-foreground"
            >
              {{ uiText('No roles available.') }}
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
            {{ uiText('Selected roles') }}: {{ selectedRoleNames.length > 0 ? selectedRoleNames.join(', ') : uiText('None') }}
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            @click="closeModal"
          >
            {{ uiText('Cancel') }}
          </Button>
          <Button
            type="submit"
            :disabled="submitLoading"
          >
            {{ submitLoading ? uiText('Saving...') : (modalMode === 'create' ? uiText('Create User') : uiText('Save Changes')) }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
