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
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
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
  code: '',
  name: '',
})

const { apiFetch } = useApi()
const { show } = useBanner()

const resetEdit = () => {
  editLoading.value = false
  editId.value = null
  editForm.code = ''
  editForm.name = ''
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
  editForm.code = typeof row.code === 'string' ? row.code : ''
  editForm.name = typeof row.name === 'string' ? row.name : ''
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
  const code = editForm.code.trim()
  if (!code) {
    show('Code is required.', 'error')
    return
  }

  const payload: Record<string, unknown> = { 
    code,
    name,
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
    <template #cell:created_at="{ item }">
      {{ item.created_at ? new Date(item.created_at).toLocaleString() : '-' }}
    </template>
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
                <Label for="company-code">Code</Label>
                <Input
                  id="company-code"
                  v-model="editForm.code"
                  placeholder="Company code"
                />
              </div>
              
              <div class="grid gap-2">
                <Label for="company-name">Name</Label>
                <Input
                  id="company-name"
                  v-model="editForm.name"
                  placeholder="Company name"
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
