<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'CategoriesPage' })
const { locale, text: uiText } = useLocale()

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  const group = row.group
  if (typeof name === 'string' && name.length > 0) {
    if (typeof group === 'string' && group.length > 0) {
      return `${name} (${group})`
    }
    return name
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'group', label: 'Group' },
  { key: 'status', label: 'Status' },
]

const statusOptions = ['active', 'inactive']
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
  parentId: '',
  group: '',
  name: '',
  status: 'active',
})
const editForm = reactive({
  parentId: '',
  group: '',
  name: '',
  status: 'active',
})

const { apiFetch } = useApi()
const { show } = useBanner()

const resetCreate = () => {
  createOpen.value = false
  createLoading.value = false
  createForm.parentId = ''
  createForm.group = ''
  createForm.name = ''
  createForm.status = 'active'
}

const openCreate = () => {
  createOpen.value = true
}

const resetEdit = () => {
  editLoading.value = false
  editId.value = null
  editForm.parentId = ''
  editForm.group = ''
  editForm.name = ''
  editForm.status = 'active'
}

const submitCreate = async () => {
  const name = createForm.name.trim()
  if (!name) {
    show('Name is required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    group: createForm.group,
  }
  const parentId = createForm.parentId.trim()
  if (parentId) {
    payload.parent_id = parentId
  } else {
    payload.parent_id = null
  }
  if (statusOptions.includes(createForm.status)) {
    payload.status = createForm.status
  }
  createLoading.value = true
  const response = await apiFetch('/categories', {
    method: 'POST',
    body: payload,
  })
  createLoading.value = false
  if (response.success) {
    show('Category created.', 'success')
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
  editForm.parentId = typeof row.parent_id === 'string' ? row.parent_id : ''
  editForm.group = typeof row.group === 'string' ? row.group : ''
  editForm.name = typeof row.name === 'string' ? row.name : ''
  const status = typeof row.status === 'string' ? row.status : ''
  editForm.status = statusOptions.includes(status) ? status : 'active'
  return true
}

const submitEdit = async (refreshList: () => Promise<void>, close: () => void) => {
  if (!editId.value) {
    show('Category id is missing.', 'error')
    return
  }
  const name = editForm.name.trim()
  if (!name) {
    show('Name is required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    group: editForm.group,
  }
  const parentId = editForm.parentId.trim()
  if (parentId) {
    payload.parent_id = parentId
  } else {
    payload.parent_id = null
  }
  if (statusOptions.includes(editForm.status)) {
    payload.status = editForm.status
  }
  editLoading.value = true
  const response = await apiFetch(`/categories/${editId.value}`, {
    method: 'PUT',
    body: payload,
  })
  editLoading.value = false
  if (response.success) {
    show('Category updated.', 'success')
    await refreshList()
    resetEdit()
    close()
  }
}
</script>

<template>
  <ResourceList
    :key="listKey"
    title="Categories"
    endpoint="/categories"
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
        <div class="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="text-lg font-semibold">
              Edit category
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
                <Label for="category-name">Name</Label>
                <Input
                  id="category-name"
                  v-model="editForm.name"
                  placeholder="Category name"
                />
              </div>
              <div class="grid gap-2">
                <Label for="category-group">Group</Label>
                <Input
                  id="category-group"
                  v-model="editForm.group"
                  placeholder="Group"
                />
              </div>
              <div class="grid gap-2">
                <Label for="category-parent-id">Parent ID</Label>
                <Input
                  id="category-parent-id"
                  v-model="editForm.parentId"
                  placeholder="Parent id"
                />
              </div>
              <div class="grid gap-2">
                <Label for="category-status">Status</Label>
                <SearchableSelect
                  id="category-status"
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
    <div class="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ uiText('Create category') }}
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
            <Label for="create-category-name">Name</Label>
            <Input
              id="create-category-name"
              v-model="createForm.name"
              placeholder="Category name"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-category-group">Group</Label>
            <Input
              id="create-category-group"
              v-model="createForm.group"
              placeholder="Group"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-category-parent-id">Parent ID</Label>
            <Input
              id="create-category-parent-id"
              v-model="createForm.parentId"
              placeholder="Parent id"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-category-status">Status</Label>
            <SearchableSelect
              id="create-category-status"
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
          {{ createLoading ? uiText('Saving...') : uiText('Create category') }}
        </Button>
      </div>
    </div>
  </div>
</template>
