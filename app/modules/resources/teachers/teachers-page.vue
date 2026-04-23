<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import type { ListResponse } from '~/types/api'

defineOptions({ name: 'TeachersPage' })
const { locale, text: uiText } = useLocale()

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  const email = row.email
  if (typeof name === 'string' && name.length > 0) {
    if (typeof email === 'string' && email.length > 0) {
      return `${name} (${email})`
    }
    return name
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  {
    key: 'branch',
    label: 'Branch',
    format: (value: unknown) => {
      if (value && typeof value === 'object') {
        const branchName = (value as { name?: string }).name
        if (typeof branchName === 'string' && branchName.length > 0) {
          return branchName
        }
      }
      return '-'
    },
  },
  { key: 'specialty', label: 'Specialty' },
  { key: 'status', label: 'Status' },
]

type BranchItem = {
  id: string
  name?: string
  city?: string
}

const statusOptions = ['active', 'inactive', 'on_leave', 'terminated']
const statusOptionList = statusOptions.map((status) => ({
  value: status,
  label: status,
}))
const listKey = ref(0)
const createOpen = ref(false)
const createLoading = ref(false)
const editLoading = ref(false)
const editId = ref<string | null>(null)
const branchesLoading = ref(false)
const branches = ref<BranchItem[]>([])
const createForm = reactive({
  branchId: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  biography: '',
  specialty: '',
  status: 'active',
})
const editForm = reactive({
  branchId: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  biography: '',
  specialty: '',
  status: 'active',
})

const { apiFetch } = useApi()
const { show } = useBanner()

const formatBranchLabel = (branch: BranchItem) => {
  const name = typeof branch.name === 'string' ? branch.name : ''
  const city = typeof branch.city === 'string' ? branch.city : ''
  if (name && city) {
    return `${name} - ${city}`
  }
  if (name) {
    return name
  }
  return branch.id
}

const branchOptions = computed(() => {
  const options = branches.value.map((branch) => ({
    value: branch.id,
    label: formatBranchLabel(branch),
  }))
  const currentValue = editForm.branchId
  if (currentValue && !options.some((option) => option.value === currentValue)) {
    options.unshift({ value: currentValue, label: currentValue })
  }
  return options
})

const loadBranches = async () => {
  branchesLoading.value = true
  const items: BranchItem[] = []
  let page = 1
  let lastPage = 1
  do {
    const response = await apiFetch<ListResponse<BranchItem>>('/branches', {
      query: { page, limit: 100 },
    })
    if (!response.success || !response.data) {
      break
    }
    items.push(...response.data.items)
    lastPage = response.data.pagination.last_page
    page += 1
  } while (page <= lastPage)
  branches.value = items
  branchesLoading.value = false
}

const resetCreate = () => {
  createOpen.value = false
  createLoading.value = false
  createForm.branchId = ''
  createForm.name = ''
  createForm.email = ''
  createForm.phone = ''
  createForm.address = ''
  createForm.birthDate = ''
  createForm.biography = ''
  createForm.specialty = ''
  createForm.status = 'active'
}

const openCreate = () => {
  createOpen.value = true
}

const resetEdit = () => {
  editLoading.value = false
  editId.value = null
  editForm.branchId = ''
  editForm.name = ''
  editForm.email = ''
  editForm.phone = ''
  editForm.address = ''
  editForm.birthDate = ''
  editForm.biography = ''
  editForm.specialty = ''
  editForm.status = 'active'
}

const submitCreate = async () => {
  const name = createForm.name.trim()
  const email = createForm.email.trim()
  if (!name || !email) {
    show('Name and email are required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    email,
    phone: createForm.phone,
    address: createForm.address,
    biography: createForm.biography,
    specialty: createForm.specialty,
  }
  const branchId = createForm.branchId.trim()
  if (branchId.length > 0) {
    payload.branch_id = branchId
  } else {
    payload.branch_id = null
  }
  const birthDate = createForm.birthDate.trim()
  if (birthDate.length > 0) {
    payload.birth_date = birthDate
  }
  if (statusOptions.includes(createForm.status)) {
    payload.status = createForm.status
  }
  createLoading.value = true
  const response = await apiFetch('/teachers', {
    method: 'POST',
    body: payload,
  })
  createLoading.value = false
  if (response.success) {
    show('Teacher created.', 'success')
    resetCreate()
    listKey.value += 1
  }
}

const syncEditForm = (row: Record<string, unknown> | null) => {
  if (!row) {
    return false
  }
  const id = row.id ?? row.uuid ?? row.code
  if (id === undefined || id === null) {
    show('Edit failed: missing id.', 'error')
    return false
  }
  const idValue = String(id)
  if (editId.value === idValue) {
    return true
  }
  editId.value = idValue
  editForm.branchId = typeof row.branch_id === 'string' ? row.branch_id : ''
  editForm.name = typeof row.name === 'string' ? row.name : ''
  editForm.email = typeof row.email === 'string' ? row.email : ''
  editForm.phone = typeof row.phone === 'string' ? row.phone : ''
  editForm.address = typeof row.address === 'string' ? row.address : ''
  editForm.birthDate = typeof row.birth_date === 'string' ? row.birth_date : ''
  editForm.biography = typeof row.biography === 'string' ? row.biography : ''
  editForm.specialty = typeof row.specialty === 'string' ? row.specialty : ''
  const status = typeof row.status === 'string' ? row.status : ''
  editForm.status = statusOptions.includes(status) ? status : 'active'
  if (!branches.value.length && !branchesLoading.value) {
    loadBranches()
  }
  return true
}

const submitEdit = async (refreshList: () => Promise<void>, close: () => void) => {
  if (!editId.value) {
    show('Teacher id is missing.', 'error')
    return
  }
  const name = editForm.name.trim()
  const email = editForm.email.trim()
  if (!name || !email) {
    show('Name and email are required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    email,
    phone: editForm.phone,
    address: editForm.address,
    biography: editForm.biography,
    specialty: editForm.specialty,
  }
  const branchId = editForm.branchId.trim()
  if (branchId.length > 0) {
    payload.branch_id = branchId
  } else {
    payload.branch_id = null
  }
  const birthDate = editForm.birthDate.trim()
  if (birthDate.length > 0) {
    payload.birth_date = birthDate
  }
  if (statusOptions.includes(editForm.status)) {
    payload.status = editForm.status
  }
  editLoading.value = true
  const response = await apiFetch(`/teachers/${editId.value}`, {
    method: 'PUT',
    body: payload,
  })
  editLoading.value = false
  if (response.success) {
    show('Teacher updated.', 'success')
    await refreshList()
    resetEdit()
    close()
  }
}

onMounted(() => {
  loadBranches()
})
</script>

<template>
  <ResourceList
    :key="listKey"
    title="Teachers"
    endpoint="/teachers"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #header-actions>
      <Button
        size="sm"
        @click="openCreate"
      >
        {{ uiText('Create teacher') }}
      </Button>
    </template>
    <template #detail="{ row, loading, close, refresh: refreshList }">
      <div
        v-if="syncEditForm(row)"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
        @click.self="close"
      >
        <div class="w-full max-w-3xl rounded-lg border bg-card p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="text-lg font-semibold">
              Edit teacher
            </div>
            <Button
              variant="outline"
              size="sm"
              :disabled="editLoading || loading"
              @click="close"
            >
              Close
            </Button>
          </div>
          <div class="mt-4 grid gap-4 text-sm">
            <div
              v-if="loading"
              class="text-muted-foreground"
            >
              {{ uiText('Loading...') }}
            </div>
            <div
              v-else
              class="grid gap-4 sm:grid-cols-2"
            >
              <div class="grid gap-2">
                <Label for="teacher-name">Name</Label>
                <Input
                  id="teacher-name"
                  v-model="editForm.name"
                  placeholder="Teacher name"
                />
              </div>
              <div class="grid gap-2">
                <Label for="teacher-email">Email</Label>
                <Input
                  id="teacher-email"
                  v-model="editForm.email"
                  type="email"
                  placeholder="Email"
                />
              </div>
              <div class="grid gap-2">
                <Label for="teacher-phone">Phone</Label>
                <Input
                  id="teacher-phone"
                  v-model="editForm.phone"
                  placeholder="Phone"
                />
              </div>
              <div class="grid gap-2">
                <Label for="teacher-status">Status</Label>
                <SearchableSelect
                  id="teacher-status"
                  v-model="editForm.status"
                  :options="statusOptionList"
                  placeholder="Select status"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="teacher-branch">Branch</Label>
                <SearchableSelect
                  id="teacher-branch"
                  v-model="editForm.branchId"
                  :options="branchOptions"
                  placeholder="Select branch"
                  search-placeholder="Search branch"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="teacher-address">Address</Label>
                <Input
                  id="teacher-address"
                  v-model="editForm.address"
                  placeholder="Address"
                />
              </div>
              <div class="grid gap-2">
                <Label for="teacher-birth-date">Birth date</Label>
                <Input
                  id="teacher-birth-date"
                  v-model="editForm.birthDate"
                  type="date"
                />
              </div>
              <div class="grid gap-2">
                <Label for="teacher-specialty">Specialty</Label>
                <Input
                  id="teacher-specialty"
                  v-model="editForm.specialty"
                  placeholder="Specialty"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="teacher-biography">Biography</Label>
                <textarea
                  id="teacher-biography"
                  v-model="editForm.biography"
                  rows="4"
                  class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="editLoading || loading"
              @click="close"
            >
              {{ uiText('Cancel') }}
            </Button>
            <Button
              size="sm"
              :disabled="editLoading || loading"
              @click="submitEdit(refreshList, close)"
            >
              {{ editLoading ? uiText('Saving...') : uiText('Save Changes') }}
            </Button>
          </div>
        </div>
      </div>
    </template>
  </ResourceList>
  <div
    v-if="createOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
    @click.self="resetCreate"
  >
    <div class="w-full max-w-3xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ uiText('Create teacher') }}
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="createLoading"
          @click="resetCreate"
        >
          Close
        </Button>
      </div>
      <div class="mt-4 grid gap-4 text-sm">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label for="create-teacher-name">Name</Label>
            <Input
              id="create-teacher-name"
              v-model="createForm.name"
              placeholder="Teacher name"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-teacher-email">Email</Label>
            <Input
              id="create-teacher-email"
              v-model="createForm.email"
              type="email"
              placeholder="Email"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-teacher-phone">Phone</Label>
            <Input
              id="create-teacher-phone"
              v-model="createForm.phone"
              placeholder="Phone"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-teacher-status">Status</Label>
            <SearchableSelect
              id="create-teacher-status"
              v-model="createForm.status"
              :options="statusOptionList"
              placeholder="Select status"
            />
          </div>
          <div class="grid gap-2 sm:col-span-2">
            <Label for="create-teacher-branch">Branch</Label>
            <SearchableSelect
              id="create-teacher-branch"
              v-model="createForm.branchId"
              :options="branchOptions"
              placeholder="Select branch"
              search-placeholder="Search branch"
            />
          </div>
          <div class="grid gap-2 sm:col-span-2">
            <Label for="create-teacher-address">Address</Label>
            <Input
              id="create-teacher-address"
              v-model="createForm.address"
              placeholder="Address"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-teacher-birth-date">Birth date</Label>
            <Input
              id="create-teacher-birth-date"
              v-model="createForm.birthDate"
              type="date"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-teacher-specialty">Specialty</Label>
            <Input
              id="create-teacher-specialty"
              v-model="createForm.specialty"
              placeholder="Specialty"
            />
          </div>
          <div class="grid gap-2 sm:col-span-2">
            <Label for="create-teacher-biography">Biography</Label>
            <textarea
              id="create-teacher-biography"
              v-model="createForm.biography"
              rows="4"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
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
          {{ createLoading ? uiText('Saving...') : uiText('Create teacher') }}
        </Button>
      </div>
    </div>
  </div>
</template>
