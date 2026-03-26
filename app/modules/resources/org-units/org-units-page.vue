<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'OrgUnitsPage' })

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'parent_id', label: 'Parent ID' },
]

const categoryOptions = ['company', 'division', 'department', 'unit']
const categoryOptionList = categoryOptions.map((cat) => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1),
}))

const listKey = ref(0)
const { apiFetch } = useApi()
const { show } = useBanner()

// Options for parent org unit selection
const parentOptions = ref<{ value: string; label: string }[]>([])
const fetchParentOptions = async () => {
  const response = await apiFetch<any>('/org-units?limit=1000') // Adjust fetch strategy as needed
  if (response.success && response.data?.items) {
    parentOptions.value = response.data.items.map((item: any) => ({
      value: item.id,
      label: item.name,
    }))
  }
}

onMounted(() => {
  fetchParentOptions()
})

// === Create State ===
const createLoading = ref(false)
const createOpen = ref(false)
const createForm = reactive({
  name: '',
  category: 'company',
  parent_id: '',
})

const openCreate = () => {
  createForm.name = ''
  createForm.category = 'company'
  createForm.parent_id = ''
  createOpen.value = true
}

const closeCreate = () => {
  createOpen.value = false
}

const submitCreate = async (refreshList: () => Promise<void>) => {
  const name = createForm.name.trim()
  if (!name) {
    show('Name is required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    category: createForm.category,
  }
  if (createForm.parent_id) {
    payload.parent_id = createForm.parent_id
  } else {
    payload.parent_id = null
  }

  createLoading.value = true
  const response = await apiFetch('/org-units', {
    method: 'POST',
    body: payload,
  })
  createLoading.value = false

  if (response.success) {
    show('Org Unit created.', 'success')
    await refreshList()
    fetchParentOptions() // refresh parent options just in case
    closeCreate()
  }
}

// === Edit State ===
const editLoading = ref(false)
const editId = ref<string | null>(null)
const editForm = reactive({
  name: '',
  category: 'company',
  parent_id: '',
})

const resetEdit = () => {
  editLoading.value = false
  editId.value = null
  editForm.name = ''
  editForm.category = 'company'
  editForm.parent_id = ''
}

const syncEditForm = (row: Record<string, unknown> | null) => {
  if (!row) return false
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
  editForm.category = categoryOptions.includes(row.category as string) ? (row.category as string) : 'company'
  editForm.parent_id = typeof row.parent_id === 'string' ? row.parent_id : ''
  return true
}

const submitEdit = async (refreshList: () => Promise<void>, close: () => void) => {
  if (!editId.value) {
    show('Org Unit id is missing.', 'error')
    return
  }
  const name = editForm.name.trim()
  if (!name) {
    show('Name is required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    name,
    category: editForm.category,
  }
  if (editForm.parent_id) {
    payload.parent_id = editForm.parent_id
  } else {
    payload.parent_id = null
  }

  editLoading.value = true
  const response = await apiFetch(`/org-units/${editId.value}`, {
    method: 'PUT',
    body: payload,
  })
  editLoading.value = false

  if (response.success) {
    show('Org Unit updated.', 'success')
    await refreshList()
    fetchParentOptions()
    resetEdit()
    close()
  }
}
</script>

<template>
  <ResourceList
    :key="listKey"
    title="Organization Units"
    endpoint="/org-units"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <!-- Header Actions (Create Button) -->
    <template #header-actions>
      <Button size="sm" @click="openCreate">
        Create new
      </Button>
    </template>

    <!-- Detail/Edit Modal -->
    <template #detail="{ row, loading, close, refresh: refreshList }">
      <div
        v-if="syncEditForm(row)"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
        @click.self="close"
      >
        <div class="w-full max-w-xl rounded-lg border bg-card p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="text-lg font-semibold">
              Edit Organization Unit
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
              Loading...
            </div>
            <div
              v-else
              class="grid gap-4"
            >
              <div class="grid gap-2">
                <Label for="org-name">Name</Label>
                <Input
                  id="org-name"
                  v-model="editForm.name"
                  placeholder="Org Unit Name"
                />
              </div>
              <div class="grid gap-2">
                <Label for="org-category">Category</Label>
                <SearchableSelect
                  id="org-category"
                  v-model="editForm.category"
                  :options="categoryOptionList"
                  placeholder="Select category"
                />
              </div>
              <div class="grid gap-2">
                <Label for="org-parent">Parent Org Unit (Optional)</Label>
                <SearchableSelect
                  id="org-parent"
                  v-model="editForm.parent_id"
                  :options="parentOptions"
                  placeholder="Select parent org unit"
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
              Cancel
            </Button>
            <Button
              size="sm"
              :disabled="editLoading || loading"
              @click="submitEdit(refreshList, close)"
            >
              {{ editLoading ? 'Saving...' : 'Save changes' }}
            </Button>
          </div>
        </div>
      </div>
    </template>
  </ResourceList>

  <!-- Create Modal -->
  <div
    v-if="createOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
    @click.self="closeCreate"
  >
    <div class="w-full max-w-xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          Create Organization Unit
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="createLoading"
          @click="closeCreate"
        >
          Close
        </Button>
      </div>
      <div class="mt-4 grid gap-4 text-sm">
        <div class="grid gap-2">
          <Label for="create-org-name">Name</Label>
          <Input
            id="create-org-name"
            v-model="createForm.name"
            placeholder="Org Unit Name"
          />
        </div>
        <div class="grid gap-2">
          <Label for="create-org-category">Category</Label>
          <SearchableSelect
            id="create-org-category"
            v-model="createForm.category"
            :options="categoryOptionList"
            placeholder="Select category"
          />
        </div>
        <div class="grid gap-2">
          <Label for="create-org-parent">Parent Org Unit (Optional)</Label>
          <SearchableSelect
            id="create-org-parent"
            v-model="createForm.parent_id"
            :options="parentOptions"
            placeholder="Select parent org unit"
          />
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="createLoading"
          @click="closeCreate"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          :disabled="createLoading"
          @click="submitCreate(() => { listKey++; return Promise.resolve(); })"
        >
          {{ createLoading ? 'Creating...' : 'Create' }}
        </Button>
      </div>
    </div>
  </div>
</template>
