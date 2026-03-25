<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'CompaniesPage' })

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created At' },
]

const statusOptions = ['active', 'inactive']
const statusOptionList = statusOptions.map((status) => ({
  value: status,
  label: status,
}))
const listKey = ref(0)
const editLoading = ref(false)
const editId = ref<string | null>(null)
const editForm = reactive({
  name: '',
  status: 'active',
})

const { apiFetch } = useApi()
const { show } = useBanner()

const resetEdit = () => {
  editLoading.value = false
  editId.value = null
  editForm.name = ''
  editForm.status = 'active'
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
  const status = typeof row.status === 'string' ? row.status : ''
  editForm.status = statusOptions.includes(status) ? status : 'active'
  return true
}

const submitEdit = async (refreshList: () => Promise<void>, close: () => void) => {
  if (!editId.value) {
    show('Company id is missing.', 'error')
    return
  }
  const name = editForm.name.trim()
  if (!name) {
    show('Name is required.', 'error')
    return
  }
  const payload: Record<string, unknown> = { name }
  if (statusOptions.includes(editForm.status)) {
    payload.status = editForm.status
  }
  editLoading.value = true
  const response = await apiFetch(`/companies/${editId.value}`, {
    method: 'PUT',
    body: payload,
  })
  editLoading.value = false
  if (response.success) {
    show('Company updated.', 'success')
    await refreshList()
    resetEdit()
    close()
  }
}
</script>

<template>
  <ResourceList
    :key="listKey"
    title="Companies"
    endpoint="/companies"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #detail="{ row, loading, close, refresh: refreshList }">
      <div
        v-if="syncEditForm(row)"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
        @click.self="close"
      >
        <div class="w-full max-w-xl rounded-lg border bg-card p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="text-lg font-semibold">
              Edit company
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
                <Label for="company-name">Name</Label>
                <Input
                  id="company-name"
                  v-model="editForm.name"
                  placeholder="Company name"
                />
              </div>
              <div class="grid gap-2">
                <Label for="company-status">Status</Label>
                <SearchableSelect
                  id="company-status"
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
</template>
