<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'BranchesPage' })
const { locale, text: uiText } = useLocale()

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  const city = row.city
  if (typeof name === 'string' && name.length > 0) {
    if (typeof city === 'string' && city.length > 0) {
      return `${name} - ${city}`
    }
    return name
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'status', label: 'Status' },
  { key: 'phone', label: 'Phone' },
]

const statusOptions = [
  'active',
  'inactive',
  'under_construction',
  'temporarily_closed',
  'planning',
]
const statusOptionList = statusOptions.map((status) => ({
  value: status,
  label: status,
}))
const listKey = ref(0)
const createOpen = ref(false)
const createLoading = ref(false)
const editLoading = ref(false)
const editId = ref<string | null>(null)
const createForm = reactive({
  name: '',
  city: '',
  capacity: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  headCoach: '',
  status: 'active',
})
const editForm = reactive({
  name: '',
  city: '',
  capacity: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  headCoach: '',
  status: 'active',
})

const { apiFetch } = useApi()
const { show } = useBanner()

const resetCreate = () => {
  createOpen.value = false
  createLoading.value = false
  createForm.name = ''
  createForm.city = ''
  createForm.capacity = ''
  createForm.description = ''
  createForm.address = ''
  createForm.phone = ''
  createForm.email = ''
  createForm.headCoach = ''
  createForm.status = 'active'
}

const openCreate = () => {
  createOpen.value = true
}

const resetEdit = () => {
  editLoading.value = false
  editId.value = null
  editForm.name = ''
  editForm.city = ''
  editForm.capacity = ''
  editForm.description = ''
  editForm.address = ''
  editForm.phone = ''
  editForm.email = ''
  editForm.headCoach = ''
  editForm.status = 'active'
}

const submitCreate = async () => {
  const name = createForm.name.trim()
  const city = createForm.city.trim()
  if (!name || !city) {
    show('Name and city are required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    city,
    description: createForm.description,
    address: createForm.address,
    phone: createForm.phone,
    head_coach: createForm.headCoach,
  }
  const email = createForm.email.trim()
  if (email) {
    payload.email = email
  }
  const capacity = createForm.capacity.trim()
  if (capacity.length > 0) {
    const capacityNumber = Number(capacity)
    if (!Number.isNaN(capacityNumber)) {
      payload.capacity = capacityNumber
    }
  }
  if (statusOptions.includes(createForm.status)) {
    payload.status = createForm.status
  }
  createLoading.value = true
  const response = await apiFetch('/branches', {
    method: 'POST',
    body: payload,
  })
  createLoading.value = false
  if (response.success) {
    show('Branch created.', 'success')
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
  editForm.name = typeof row.name === 'string' ? row.name : ''
  editForm.city = typeof row.city === 'string' ? row.city : ''
  editForm.capacity = row.capacity !== null && row.capacity !== undefined ? String(row.capacity) : ''
  editForm.description = typeof row.description === 'string' ? row.description : ''
  editForm.address = typeof row.address === 'string' ? row.address : ''
  editForm.phone = typeof row.phone === 'string' ? row.phone : ''
  editForm.email = typeof row.email === 'string' ? row.email : ''
  editForm.headCoach = typeof row.head_coach === 'string' ? row.head_coach : ''
  const status = typeof row.status === 'string' ? row.status : ''
  editForm.status = statusOptions.includes(status) ? status : 'active'
  return true
}

const submitEdit = async (refreshList: () => Promise<void>, close: () => void) => {
  if (!editId.value) {
    show('Branch id is missing.', 'error')
    return
  }
  const name = editForm.name.trim()
  const city = editForm.city.trim()
  if (!name || !city) {
    show('Name and city are required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    city,
    description: editForm.description,
    address: editForm.address,
    phone: editForm.phone,
    head_coach: editForm.headCoach,
  }
  const email = editForm.email.trim()
  if (email) {
    payload.email = email
  }
  const capacity = editForm.capacity.trim()
  if (capacity.length > 0) {
    const capacityNumber = Number(capacity)
    if (!Number.isNaN(capacityNumber)) {
      payload.capacity = capacityNumber
    }
  }
  if (statusOptions.includes(editForm.status)) {
    payload.status = editForm.status
  }
  editLoading.value = true
  const response = await apiFetch(`/branches/${editId.value}`, {
    method: 'PUT',
    body: payload,
  })
  editLoading.value = false
  if (response.success) {
    show('Branch updated.', 'success')
    await refreshList()
    resetEdit()
    close()
  }
}
</script>

<template>
  <ResourceList
    :key="listKey"
    title="Branches"
    endpoint="/branches"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #header-actions>
      <Button
        size="sm"
        @click="openCreate"
      >
        {{ uiText('Add New') }}
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
              Edit branch
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
                <Label for="branch-name">Name</Label>
                <Input
                  id="branch-name"
                  v-model="editForm.name"
                  placeholder="Branch name"
                />
              </div>
              <div class="grid gap-2">
                <Label for="branch-city">City</Label>
                <Input
                  id="branch-city"
                  v-model="editForm.city"
                  placeholder="City"
                />
              </div>
              <div class="grid gap-2">
                <Label for="branch-capacity">Capacity</Label>
                <Input
                  id="branch-capacity"
                  v-model="editForm.capacity"
                  type="number"
                  min="1"
                  placeholder="Capacity"
                />
              </div>
              <div class="grid gap-2">
                <Label for="branch-status">Status</Label>
                <SearchableSelect
                  id="branch-status"
                  v-model="editForm.status"
                  :options="statusOptionList"
                  placeholder="Select status"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="branch-description">Description</Label>
                <Input
                  id="branch-description"
                  v-model="editForm.description"
                  placeholder="Description"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="branch-address">Address</Label>
                <Input
                  id="branch-address"
                  v-model="editForm.address"
                  placeholder="Address"
                />
              </div>
              <div class="grid gap-2">
                <Label for="branch-phone">Phone</Label>
                <Input
                  id="branch-phone"
                  v-model="editForm.phone"
                  placeholder="Phone"
                />
              </div>
              <div class="grid gap-2">
                <Label for="branch-email">Email</Label>
                <Input
                  id="branch-email"
                  v-model="editForm.email"
                  type="email"
                  placeholder="Email"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="branch-head-coach">Head coach</Label>
                <Input
                  id="branch-head-coach"
                  v-model="editForm.headCoach"
                  placeholder="Head coach"
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
          {{ uiText('Create branch') }}
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
            <Label for="create-branch-name">Name</Label>
            <Input
              id="create-branch-name"
              v-model="createForm.name"
              placeholder="Branch name"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-branch-city">City</Label>
            <Input
              id="create-branch-city"
              v-model="createForm.city"
              placeholder="City"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-branch-capacity">Capacity</Label>
            <Input
              id="create-branch-capacity"
              v-model="createForm.capacity"
              type="number"
              min="1"
              placeholder="Capacity"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-branch-status">Status</Label>
            <SearchableSelect
              id="create-branch-status"
              v-model="createForm.status"
              :options="statusOptionList"
              placeholder="Select status"
            />
          </div>
          <div class="grid gap-2 sm:col-span-2">
            <Label for="create-branch-description">Description</Label>
            <Input
              id="create-branch-description"
              v-model="createForm.description"
              placeholder="Description"
            />
          </div>
          <div class="grid gap-2 sm:col-span-2">
            <Label for="create-branch-address">Address</Label>
            <Input
              id="create-branch-address"
              v-model="createForm.address"
              placeholder="Address"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-branch-phone">Phone</Label>
            <Input
              id="create-branch-phone"
              v-model="createForm.phone"
              placeholder="Phone"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-branch-email">Email</Label>
            <Input
              id="create-branch-email"
              v-model="createForm.email"
              type="email"
              placeholder="Email"
            />
          </div>
          <div class="grid gap-2 sm:col-span-2">
            <Label for="create-branch-head-coach">Head coach</Label>
            <Input
              id="create-branch-head-coach"
              v-model="createForm.headCoach"
              placeholder="Head coach"
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
          {{ createLoading ? uiText('Saving...') : uiText('Create branch') }}
        </Button>
      </div>
    </div>
  </div>
</template>
