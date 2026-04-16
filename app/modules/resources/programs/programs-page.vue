<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { localizeUiText } from '~/utils/ui-localization'

defineOptions({ name: 'ProgramsPage' })
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
  { key: 'description', label: 'Description' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'status', label: 'Status' },
]

const statusOptions = ['active', 'inactive', 'archived']
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
  description: '',
  capacity: '',
  status: 'active',
})
const editForm = reactive({
  name: '',
  description: '',
  capacity: '',
  status: 'active',
})

const { apiFetch } = useApi()
const { show } = useBanner()

const resetCreate = () => {
  createOpen.value = false
  createLoading.value = false
  createForm.name = ''
  createForm.description = ''
  createForm.capacity = ''
  createForm.status = 'active'
}

const openCreate = () => {
  createOpen.value = true
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
  editForm.description = typeof row.description === 'string' ? row.description : ''
  editForm.capacity = row.capacity !== null && row.capacity !== undefined ? String(row.capacity) : ''
  const status = typeof row.status === 'string' ? row.status : ''
  editForm.status = statusOptions.includes(status) ? status : 'active'
  return true
}

const submitCreate = async () => {
  const name = createForm.name.trim()
  if (!name) {
    show('Program name is required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    description: createForm.description,
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
  const response = await apiFetch('/programs', {
    method: 'POST',
    body: payload,
  })
  createLoading.value = false
  if (response.success) {
    show('Program created.', 'success')
    resetCreate()
    listKey.value += 1
  }
}

const submitEdit = async (refreshList: () => Promise<void>) => {
  if (!editId.value) {
    return
  }
  const payload: Record<string, unknown> = {}
  const name = editForm.name.trim()
  if (name.length > 0) {
    payload.name = name
  }
  payload.description = editForm.description
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
  if (Object.keys(payload).length === 0) {
    show('No changes to save.', 'info')
    return
  }
  editLoading.value = true
  const response = await apiFetch(`/programs/${editId.value}`, {
    method: 'PUT',
    body: payload,
  })
  editLoading.value = false
  if (response.success) {
    show('Program updated.', 'success')
    await refreshList()
  }
}
</script>

<template>
  <ResourceList
    :key="listKey"
    title="Programs"
    endpoint="/programs"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #header-actions>
      <Button
        size="sm"
        @click="openCreate"
      >
        {{ uiText('Create program') }}
      </Button>
    </template>
    <template #detail="{ row, loading, close, refresh: refreshList }">
      <div
        v-if="syncEditForm(row)"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      >
        <div class="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="text-lg font-semibold">
              Edit program
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
              class="grid gap-4"
            >
              <div class="grid gap-2">
                <Label for="program-name">Name</Label>
                <Input
                  id="program-name"
                  v-model="editForm.name"
                  placeholder="Program name"
                />
              </div>
              <div class="grid gap-2">
                <Label for="program-description">Description</Label>
                <Input
                  id="program-description"
                  v-model="editForm.description"
                  placeholder="Program description"
                />
              </div>
              <div class="grid gap-2">
                <Label for="program-capacity">Capacity</Label>
                <Input
                  id="program-capacity"
                  v-model="editForm.capacity"
                  type="number"
                  min="0"
                  placeholder="Capacity"
                />
              </div>
              <div class="grid gap-2">
                <Label for="program-status">Status</Label>
                <SearchableSelect
                  id="program-status"
                  v-model="editForm.status"
                  :options="statusOptionList"
                  placeholder="Select status"
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
              @click="submitEdit(refreshList)"
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
    <div class="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ uiText('Create program') }}
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
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="create-program-name">Name</Label>
            <Input
              id="create-program-name"
              v-model="createForm.name"
              placeholder="Program name"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-program-description">Description</Label>
            <Input
              id="create-program-description"
              v-model="createForm.description"
              placeholder="Program description"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-program-capacity">Capacity</Label>
            <Input
              id="create-program-capacity"
              v-model="createForm.capacity"
              type="number"
              min="0"
              placeholder="Capacity"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-program-status">Status</Label>
            <SearchableSelect
              id="create-program-status"
              v-model="createForm.status"
              :options="statusOptionList"
              placeholder="Select status"
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
          {{ createLoading ? uiText('Saving...') : uiText('Create program') }}
        </Button>
      </div>
    </div>
  </div>
</template>
