<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useAsyncData } from '#app'
import type { ApiResponse, ListResponse, PaginationMeta } from '~/types/api'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'RolesPage' })
const { locale, text: uiText } = useLocale()
const { user } = useAuth()
const { formatReadableDateTime } = useDateTime()
const appOrigin = computed(() => (import.meta.client ? window.location.origin : ''))
const PERMISSION_SEARCH_DEBOUNCE_MS = 600

type PermissionItem = {
  id: string
  name?: string
  description?: string
}

type InvitationResponse = {
  id: string
  accept_token: string
  expires_at: string
}

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  {
    key: 'permissions',
    label: 'Permissions',
    format: (value: unknown) => {
      const permissions = value as { id: string }[] | undefined
      return permissions ? String(permissions.length) : '0'
    },
  },
]

const { apiFetch } = useApi()
const { show } = useBanner()
const listKey = ref(0)
const createOpen = ref(false)
const createLoading = ref(false)
const editLoading = ref(false)
const permissionListQueryInput = ref('')
const permissionListQuery = ref('')
let permissionListQueryTimer: ReturnType<typeof setTimeout> | null = null
const permissionPage = ref(1)
const permissionLimit = ref(15)
const createPermissionQueryInput = ref('')
const createPermissionQuery = ref('')
let createPermissionQueryTimer: ReturnType<typeof setTimeout> | null = null
const createPermissionPage = ref(1)
const createPermissionLimit = ref(15)
const createPermissionPagination = ref<PaginationMeta | null>(null)
const createPermissionsLoading = ref(false)
const createForm = reactive({
  name: '',
  description: '',
  permissionIds: [] as string[],
})
const editForm = reactive({
  id: '',
  name: '',
  description: '',
  permissionIds: [] as string[],
})
const createPermissionResults = ref<PermissionItem[]>([])
const createPermissions = ref<PermissionItem[]>([])
const editPermissionResults = ref<PermissionItem[]>([])
const editPermissionItems = ref<PermissionItem[]>([])
const editPermissionQueryInput = ref('')
const editPermissionQuery = ref('')
let editPermissionQueryTimer: ReturnType<typeof setTimeout> | null = null
const adminInviteOpen = ref(false)
const adminInviteLoading = ref(false)
const adminInviteEmail = ref('')
const adminInviteResult = ref<InvitationResponse | null>(null)

const permissionsRequestController = ref<AbortController | null>(null)
const canInviteAdmins = computed(() => {
  const roles = Array.isArray(user.value?.roles) ? user.value.roles : []
  return roles.includes('owner')
})

const { data, pending, error, refresh } = useAsyncData(
  'permissions:list',
  () => {
    permissionsRequestController.value?.abort()
    permissionsRequestController.value = import.meta.client ? new AbortController() : null
    return apiFetch<ListResponse<PermissionItem>>('/role-and-permissions/permissions', {
      query: {
        page: permissionPage.value,
        limit: permissionLimit.value,
        q: permissionListQuery.value || undefined,
      },
      signal: permissionsRequestController.value?.signal,
    })
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

const permissions = computed(() => {
  const response =
    (data.value as ApiResponse<ListResponse<PermissionItem>> | undefined)?.success
      ? data.value as ApiResponse<ListResponse<PermissionItem>> | undefined
      : lastSuccessfulPermissionResponse.value
  return response?.data?.items ?? []
})
const permissionPagination = computed(() => {
  const response =
    (data.value as ApiResponse<ListResponse<PermissionItem>> | undefined)?.success
      ? data.value as ApiResponse<ListResponse<PermissionItem>> | undefined
      : lastSuccessfulPermissionResponse.value
  return response?.data?.pagination
})
const permissionCurrentPage = computed(() => permissionPagination.value?.page ?? permissionPage.value ?? 1)
const permissionLastPage = computed(() => permissionPagination.value?.last_page ?? 1)
const permissionSkeletonRows = computed(() => Math.max(1, Number(permissionLimit.value ?? 1)))
const loadCreatePermissions = async () => {
  if (createPermissionQuery.value.trim()) {
    return
  }
  createPermissionsLoading.value = true
  const response = await apiFetch<ListResponse<PermissionItem>>('/role-and-permissions/permissions', {
    query: {
      page: createPermissionPage.value,
      limit: createPermissionLimit.value,
    },
  })
  createPermissionsLoading.value = false
  if (!response.success || !response.data) {
    createPermissions.value = []
    createPermissionPagination.value = null
    return
  }
  createPermissions.value = response.data.items
  createPermissionPagination.value = response.data.pagination
}

const fetchPermissionsByQuery = async (query: string) => {
  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }
  const items: PermissionItem[] = []
  let page = 1
  let lastPage = 1
  do {
    const response = await apiFetch<ListResponse<PermissionItem>>('/role-and-permissions/permissions', {
      query: {
        page,
        limit: 100,
        q: trimmed,
      },
    })
    if (!response.success || !response.data) {
      break
    }
    items.push(...response.data.items)
    lastPage = response.data.pagination.last_page
    page += 1
  } while (page <= lastPage)
  return items
}

const filteredPermissions = computed(() => {
  const term = createPermissionQuery.value.trim()
  if (!term) {
    return createPermissions.value
  }
  return createPermissionResults.value
})
const createPermissionSkeletonRows = computed(() =>
  Math.max(1, Number(createPermissionLimit.value ?? 1)),
)
const createPermissionCurrentPage = computed(() =>
  createPermissionPagination.value?.page ?? createPermissionPage.value ?? 1,
)
const createPermissionLastPage = computed(() => createPermissionPagination.value?.last_page ?? 1)
const editPermissionOptions = computed(() => {
  const map = new Map<string, PermissionItem>()
  permissions.value.forEach((permission) => {
    map.set(permission.id, permission)
  })
  editPermissionResults.value.forEach((permission) => {
    if (!map.has(permission.id)) {
      map.set(permission.id, permission)
    }
  })
  editPermissionItems.value.forEach((permission) => {
    if (!map.has(permission.id)) {
      map.set(permission.id, permission)
    }
  })
  return Array.from(map.values())
})
const editPermissionSearchOptions = computed(() => {
  if (!editPermissionQuery.value.trim()) {
    return editPermissionOptions.value
  }
  const map = new Map<string, PermissionItem>()
  editPermissionResults.value.forEach((permission) => {
    map.set(permission.id, permission)
  })
  editPermissionItems.value.forEach((permission) => {
    if (!map.has(permission.id)) {
      map.set(permission.id, permission)
    }
  })
  return Array.from(map.values())
})
const filteredEditPermissions = computed(() => {
  const term = editPermissionQuery.value.trim()
  if (!term) {
    return editPermissionOptions.value
  }
  return editPermissionSearchOptions.value
})

watch(
  () => [permissionPage.value, permissionLimit.value, permissionListQuery.value],
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
  () => permissionListQuery.value,
  (value, previous) => {
    if (value !== previous) {
      permissionPage.value = 1
    }
  },
)

watch(
  () => [createPermissionPage.value, createPermissionLimit.value],
  () => {
    if (!createPermissionQuery.value.trim()) {
      loadCreatePermissions()
    }
  },
)

watch(
  () => createPermissionLimit.value,
  (value, previous) => {
    if (value !== previous) {
      createPermissionPage.value = 1
    }
  },
)

watch(
  () => permissionListQueryInput.value,
  (value) => {
    if (permissionListQueryTimer) {
      clearTimeout(permissionListQueryTimer)
    }
    permissionListQueryTimer = setTimeout(() => {
      permissionListQuery.value = value.trim()
    }, PERMISSION_SEARCH_DEBOUNCE_MS)
  },
)

watch(
  () => createPermissionQueryInput.value,
  (value) => {
    if (createPermissionQueryTimer) {
      clearTimeout(createPermissionQueryTimer)
    }
    createPermissionQueryTimer = setTimeout(() => {
      createPermissionQuery.value = value.trim()
    }, PERMISSION_SEARCH_DEBOUNCE_MS)
  },
)

watch(
  () => editPermissionQueryInput.value,
  (value) => {
    if (editPermissionQueryTimer) {
      clearTimeout(editPermissionQueryTimer)
    }
    editPermissionQueryTimer = setTimeout(() => {
      editPermissionQuery.value = value.trim()
    }, PERMISSION_SEARCH_DEBOUNCE_MS)
  },
)

watch(
  () => createPermissionQuery.value,
  async (value) => {
    if (!value.trim()) {
      createPermissionResults.value = []
      await loadCreatePermissions()
      return
    }
    createPermissionResults.value = await fetchPermissionsByQuery(value)
  },
)

watch(
  () => editPermissionQuery.value,
  async (value) => {
    if (!value.trim()) {
      editPermissionResults.value = []
      return
    }
    editPermissionResults.value = await fetchPermissionsByQuery(value)
  },
)

onBeforeUnmount(() => {
  permissionsRequestController.value?.abort()
  if (permissionListQueryTimer) {
    clearTimeout(permissionListQueryTimer)
  }
  if (createPermissionQueryTimer) {
    clearTimeout(createPermissionQueryTimer)
  }
  if (editPermissionQueryTimer) {
    clearTimeout(editPermissionQueryTimer)
  }
})

const resetCreate = () => {
  createOpen.value = false
  createLoading.value = false
  createForm.name = ''
  createForm.description = ''
  createForm.permissionIds = []
  createPermissionQueryInput.value = ''
  createPermissionQuery.value = ''
  createPermissionResults.value = []
  createPermissions.value = []
  createPermissionPagination.value = null
}
const resetEdit = () => {
  editLoading.value = false
  editForm.id = ''
  editForm.name = ''
  editForm.description = ''
  editForm.permissionIds = []
  editPermissionItems.value = []
  editPermissionQueryInput.value = ''
  editPermissionQuery.value = ''
  editPermissionResults.value = []
}

const openCreate = async () => {
  if (!createPermissions.value.length) {
    await loadCreatePermissions()
  }
  createOpen.value = true
}
const handleEditClose = (close: () => void) => {
  resetEdit()
  close()
}

const togglePermission = (id: string) => {
  if (createForm.permissionIds.includes(id)) {
    createForm.permissionIds = createForm.permissionIds.filter((item) => item !== id)
    return
  }
  createForm.permissionIds = [...createForm.permissionIds, id]
}
const toggleEditPermission = (id: string) => {
  if (editForm.permissionIds.includes(id)) {
    editForm.permissionIds = editForm.permissionIds.filter((item) => item !== id)
    return
  }
  editForm.permissionIds = [...editForm.permissionIds, id]
}

const submitCreate = async () => {
  const name = createForm.name.trim()
  if (!name) {
    show(uiText('Role name is required.'), 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    permissions: createForm.permissionIds,
  }
  const description = createForm.description.trim()
  if (description.length > 0) {
    payload.description = description
  }
  createLoading.value = true
  const response = await apiFetch('/role-and-permissions/roles', {
    method: 'POST',
    body: payload,
  })
  createLoading.value = false
  if (response.success) {
    show(uiText('Role created.'), 'success')
    resetCreate()
    listKey.value += 1
  }
}
const syncEditForm = (row: Record<string, unknown> | null) => {
  if (!row) {
    return false
  }
  const id = typeof row.id === 'string' ? row.id : String(row.id ?? '')
  if (!id || editForm.id === id) {
    return true
  }
  editForm.id = id
  editForm.name = typeof row.name === 'string' ? row.name : ''
  editForm.description = typeof row.description === 'string' ? row.description : ''
  const permissionRows = Array.isArray(row.permissions) ? row.permissions : []
  const items: PermissionItem[] = []
  permissionRows.forEach((permission) => {
    if (!permission || typeof permission !== 'object') {
      return
    }
    const record = permission as Record<string, unknown>
    const permId = typeof record.id === 'string' ? record.id : null
    if (!permId) {
      return
    }
    items.push({
      id: permId,
      name: typeof record.name === 'string' ? record.name : undefined,
      description: typeof record.description === 'string' ? record.description : undefined,
    })
  })
  editPermissionItems.value = items
  editForm.permissionIds = items.map((item) => item.id)
  editPermissionQueryInput.value = ''
  editPermissionQuery.value = ''
  if (!permissions.value.length) {
    refresh()
  }
  return true
}
const submitUpdate = async (close: () => void, refreshList: () => Promise<void>) => {
  const name = editForm.name.trim()
  if (!name) {
    show(uiText('Role name is required.'), 'error')
    return
  }
  if (!editForm.id) {
    show(uiText('Role id is missing.'), 'error')
    return
  }
  editLoading.value = true
  const payload: Record<string, unknown> = {
    name,
    description: editForm.description.trim(),
    permission_ids: editForm.permissionIds,
  }
  const response = await apiFetch(`/role-and-permissions/roles/${editForm.id}`, {
    method: 'PUT',
    body: payload,
  })
  editLoading.value = false
  if (response.success) {
    show(uiText('Role updated.'), 'success')
    await refreshList()
    handleEditClose(close)
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

const nextCreatePermissionPage = () => {
  if (createPermissionPagination.value && createPermissionPage.value < createPermissionPagination.value.last_page) {
    createPermissionPage.value += 1
  }
}

const prevCreatePermissionPage = () => {
  if (createPermissionPage.value > 1) {
    createPermissionPage.value -= 1
  }
}

const openAdminInvite = () => {
  adminInviteEmail.value = ''
  adminInviteResult.value = null
  adminInviteOpen.value = true
}

const closeAdminInvite = () => {
  adminInviteOpen.value = false
  adminInviteLoading.value = false
  adminInviteEmail.value = ''
  adminInviteResult.value = null
}

const adminInvitationLink = computed(() => {
  if (!adminInviteResult.value?.accept_token || !appOrigin.value) {
    return ''
  }

  return `${appOrigin.value}/auth/invitation?token=${encodeURIComponent(adminInviteResult.value.accept_token)}`
})

const formatInvitationDateTime = (value: string | null | undefined) => (
  formatReadableDateTime(value, undefined, '-')
)

const copyToClipboard = async (value: string, successMessage: string) => {
  if (!value || !import.meta.client || !navigator.clipboard) {
    show(uiText('Clipboard is not available in this browser'), 'error')
    return
  }

  await navigator.clipboard.writeText(value)
  show(uiText(successMessage), 'success')
}

const submitAdminInvite = async () => {
  const email = adminInviteEmail.value.trim()
  if (!email) {
    show(uiText('Email is required'), 'error')
    return
  }

  adminInviteLoading.value = true
  const response = await apiFetch<InvitationResponse>('/user-invitations', {
    method: 'POST',
    body: {
      email,
      role_code: 'admin',
    },
  })
  adminInviteLoading.value = false

  if (!response.success || !response.data) {
    return
  }

  adminInviteResult.value = response.data
  show(uiText('Admin invitation created successfully'), 'success')
}
</script>

<template>
  <div class="space-y-6">
    <ResourceList
      :key="listKey"
      title="Roles"
      endpoint="/role-and-permissions/roles"
      :columns="columns"
      :search-debounce-ms="1000"
      loading-variant="skeleton"
      :delete-label-formatter="deleteLabelFormatter"
    >
      <template #header-actions>
        <Button
          size="sm"
          @click="openCreate"
        >
          {{ uiText('Create role') }}
        </Button>
        <Button
          v-if="canInviteAdmins"
          size="sm"
          variant="outline"
          @click="openAdminInvite"
        >
          {{ uiText('Invite Admin') }}
        </Button>
      </template>
      <template #detail="{ row, loading, close, refresh: refreshList }">
        <div
          v-if="syncEditForm(row)"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
          @click.self="handleEditClose(close)"
        >
          <div class="w-full max-w-5xl rounded-lg border bg-card p-6 shadow-lg">
            <div class="flex items-center justify-between">
              <div class="text-lg font-semibold">
                {{ uiText('Edit role') }}
              </div>
              <Button
                variant="outline"
                size="sm"
                :disabled="editLoading || loading"
                @click="handleEditClose(close)"
              >
                {{ uiText('Close') }}
              </Button>
            </div>
            <div class="mt-4 max-h-[70vh] overflow-auto">
              <div class="grid gap-4 text-sm">
                <div
                  v-if="loading"
                  class="text-muted-foreground"
                >
                  {{ uiText('Loading...') }}
                </div>
                <div
                  v-else
                  class="grid gap-4"
                >
                  <div class="grid gap-2">
                    <Label for="edit-role-name">{{ uiText('Role name') }}</Label>
                    <Input
                      id="edit-role-name"
                      v-model="editForm.name"
                      :placeholder="uiText('Role name')"
                    />
                  </div>
                  <div class="grid gap-2">
                    <Label for="edit-role-description">{{ uiText('Description') }}</Label>
                    <Input
                      id="edit-role-description"
                      v-model="editForm.description"
                      :placeholder="uiText('Role description')"
                    />
                  </div>
                  <div class="grid gap-2">
                    <Label>{{ uiText('Permissions') }}</Label>
                    <Input
                      v-model="editPermissionQueryInput"
                      :placeholder="uiText('Search permissions')"
                    />
                    <div class="max-h-72 overflow-auto rounded-md border p-2">
                      <div
                        v-if="filteredEditPermissions.length === 0"
                        class="text-sm text-muted-foreground"
                      >
                        {{ uiText('No permissions found.') }}
                      </div>
                      <div
                        v-else
                        class="grid gap-2"
                      >
                        <label
                          v-for="permission in filteredEditPermissions"
                          :key="permission.id"
                          class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-accent"
                        >
                          <input
                            :checked="editForm.permissionIds.includes(permission.id)"
                            class="mt-1 h-4 w-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            type="checkbox"
                            @change="toggleEditPermission(permission.id)"
                          >
                          <div class="grid">
                            <span class="text-sm font-medium">
                              {{ permission.name }}
                            </span>
                            <span class="text-xs text-muted-foreground">
                              {{ permission.description || '-' }}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="editLoading || loading"
                @click="handleEditClose(close)"
              >
                {{ uiText('Cancel') }}
              </Button>
              <Button
                size="sm"
                :disabled="editLoading || loading"
                @click="submitUpdate(close, refreshList)"
              >
                {{ editLoading ? uiText('Saving...') : uiText('Save Changes') }}
              </Button>
            </div>
          </div>
        </div>
      </template>
    </ResourceList>

    <Card class="overflow-hidden rounded-[28px] border-border/80 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.82)]">
      <CardHeader class="border-b border-border/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.98))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))]">
        <div class="space-y-1">
          <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {{ uiText('Roles & Permissions') }}
          </div>
          <CardTitle>{{ uiText('Permissions') }}</CardTitle>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ uiText('Permissions are managed by the backend and are read-only here.') }}
        </p>
      </CardHeader>
      <CardContent class="pt-5">
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <Input
            v-model="permissionListQueryInput"
            :placeholder="uiText('Search permissions')"
            class="h-11 w-56 rounded-2xl border-border/80 bg-background/90 shadow-sm"
          />
        </div>
        <div
          v-if="error"
          class="text-sm text-destructive"
        >
          {{ uiText('Failed to load permissions.') }}
        </div>
        <div v-else>
          <div class="overflow-hidden rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.46))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.56),rgba(2,6,23,0.24))]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ uiText('Name') }}</TableHead>
                  <TableHead>{{ uiText('Description') }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="pending">
                  <TableRow
                    v-for="index in permissionSkeletonRows"
                    :key="`permission-table-skeleton-${index}`"
                  >
                    <TableCell>
                      <div class="h-4 w-32 rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div class="h-4 w-56 rounded bg-muted/70 animate-pulse" />
                    </TableCell>
                  </TableRow>
                </template>
                <template v-else>
                  <TableRow
                    v-for="permission in permissions"
                    :key="permission.id"
                  >
                    <TableCell>{{ permission.name }}</TableCell>
                    <TableCell>{{ permission.description }}</TableCell>
                  </TableRow>
                  <TableRow v-if="permissions.length === 0">
                    <TableCell
                      colspan="2"
                      class="py-10 text-center text-muted-foreground"
                    >
                      {{ uiText('No permissions available.') }}
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 bg-muted/10 px-6 py-4 text-sm">
        <div class="text-muted-foreground">
          {{ uiText('Page') }} {{ permissionCurrentPage }} {{ uiText('of') }} {{ permissionLastPage }}
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl"
            :disabled="permissionPage === 1"
            @click="prevPermissionPage"
          >
            {{ uiText('Previous') }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl"
            :disabled="permissionPage >= permissionLastPage"
            @click="nextPermissionPage"
          >
            {{ uiText('Next') }}
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>

  <div
    v-if="adminInviteOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
  >
    <div class="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ uiText('Invite Admin Access') }}
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="adminInviteLoading"
          @click="closeAdminInvite"
        >
          {{ uiText('Close') }}
        </Button>
      </div>
      <div class="mt-2 text-sm text-muted-foreground">
        {{ uiText('Use this flow for admin account access while users stay hidden from the main product navigation.') }}
      </div>
      <div class="mt-4 grid gap-4">
        <div class="grid gap-2">
          <Label for="admin-invite-email">{{ uiText('Admin email') }}</Label>
          <Input
            id="admin-invite-email"
            v-model="adminInviteEmail"
            type="email"
            :placeholder="uiText('e.g. admin@example.com')"
          />
        </div>
        <div
          v-if="adminInviteResult"
          class="space-y-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/20"
        >
          <div class="font-medium text-emerald-900 dark:text-emerald-100">
            {{ uiText('Invitation token is ready') }}
          </div>
          <div class="text-emerald-800 dark:text-emerald-200">
            {{ uiText('Email delivery is not wired yet, so keep this token for the acceptance flow.') }}
          </div>
          <div class="space-y-1">
            <Label for="admin-invitation-token">{{ uiText('Invitation token') }}</Label>
            <Input
              id="admin-invitation-token"
              :model-value="adminInviteResult.accept_token"
              readonly
            />
          </div>
          <div class="space-y-1">
            <Label for="admin-invitation-link">{{ uiText('Invitation link') }}</Label>
            <Input
              id="admin-invitation-link"
              :model-value="adminInvitationLink"
              readonly
            />
          </div>
          <div class="text-xs text-emerald-800/80 dark:text-emerald-200/80">
            {{ uiText('Expires at') }}: {{ formatInvitationDateTime(adminInviteResult.expires_at) }}
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="copyToClipboard(adminInviteResult.accept_token, 'Invitation token copied')"
            >
              {{ uiText('Copy token') }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="copyToClipboard(adminInvitationLink, 'Invitation link copied')"
            >
              {{ uiText('Copy invitation link') }}
            </Button>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="adminInviteLoading"
          @click="closeAdminInvite"
        >
          {{ uiText('Cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="adminInviteLoading"
          @click="submitAdminInvite"
        >
          {{ adminInviteLoading ? uiText('Sending...') : uiText('Create Invitation') }}
        </Button>
      </div>
    </div>
  </div>

  <div
    v-if="createOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
  >
    <div class="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ uiText('Create role') }}
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="createLoading"
          @click="resetCreate"
        >
          {{ uiText('Close') }}
        </Button>
      </div>
      <div class="mt-4 grid gap-4">
        <div class="grid gap-2">
          <Label for="role-name">{{ uiText('Role name') }}</Label>
          <Input
            id="role-name"
            v-model="createForm.name"
            :placeholder="uiText('Role name')"
          />
        </div>
        <div class="grid gap-2">
          <Label for="role-description">{{ uiText('Description') }}</Label>
          <Input
            id="role-description"
            v-model="createForm.description"
            :placeholder="uiText('Role description')"
          />
        </div>
        <div class="grid gap-2">
          <Label>{{ uiText('Permissions') }}</Label>
          <Input
            v-model="createPermissionQueryInput"
            :placeholder="uiText('Search permissions')"
          />
          <div
            class="max-h-72 overflow-auto rounded-md border p-2"
            :class="createPermissionsLoading ? 'pointer-events-none opacity-60' : ''"
          >
            <div
              v-if="createPermissionsLoading"
              class="grid gap-2"
            >
              <div
                v-for="index in createPermissionSkeletonRows"
                :key="`permission-skeleton-${index}`"
                class="flex items-start gap-2 rounded-md px-2 py-1"
              >
                <div class="mt-1 h-4 w-4 rounded-sm bg-muted animate-pulse" />
                <div class="grid gap-1">
                  <div class="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div class="h-3 w-44 rounded bg-muted/70 animate-pulse" />
                </div>
              </div>
            </div>
            <div
              v-else-if="filteredPermissions.length === 0"
              class="text-sm text-muted-foreground"
            >
              {{ uiText('No permissions found.') }}
            </div>
            <div
              v-else
              class="grid gap-2"
            >
              <label
                v-for="permission in filteredPermissions"
                :key="permission.id"
                class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-accent"
              >
                <input
                  :checked="createForm.permissionIds.includes(permission.id)"
                  class="mt-1 h-4 w-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  type="checkbox"
                  @change="togglePermission(permission.id)"
                >
                <div class="grid">
                  <span class="text-sm font-medium">
                    {{ permission.name }}
                  </span>
                  <span class="text-xs text-muted-foreground">
                    {{ permission.description || '-' }}
                  </span>
                </div>
              </label>
            </div>
          </div>
          <div
            v-if="!createPermissionQuery"
            class="flex items-center justify-between gap-3 border-t border-border/60 pt-3 text-sm"
          >
            <div
              class="text-muted-foreground"
            >
              {{ uiText('Page') }} {{ createPermissionCurrentPage }} {{ uiText('of') }} {{ createPermissionLastPage }}
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="createPermissionPage === 1"
                @click="prevCreatePermissionPage"
              >
                {{ uiText('Previous') }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="createPermissionPage >= createPermissionLastPage"
                @click="nextCreatePermissionPage"
              >
                {{ uiText('Next') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="createLoading"
          @click="resetCreate"
        >
          {{ uiText('Cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="createLoading"
          @click="submitCreate"
        >
          {{ createLoading ? uiText('Saving...') : uiText('Create role') }}
        </Button>
      </div>
    </div>
  </div>
</template>
