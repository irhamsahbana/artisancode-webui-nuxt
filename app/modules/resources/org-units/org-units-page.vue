<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'OrgUnitsPage' })
const { locale, t } = useLocale()

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
  const response = await apiFetch<any>('/org-units?limit=1000')
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
  
  payload.parent_id = createForm.parent_id || null

  createLoading.value = true
  const response = await apiFetch('/org-units', {
    method: 'POST',
    body: payload,
  })
  createLoading.value = false

  if (response.success) {
    show('Org Unit created.', 'success')
    await refreshList()
    fetchParentOptions()
    closeCreate()
  }
}

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}
</script>

<template>
  <ResourceList
    :key="listKey"
    :title="t('ui.organizationUnits')"
    endpoint="/org-units"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <!-- Header Actions (Create Button) -->
    <template #header-actions>
      <Button
        size="sm"
        @click="openCreate"
      >
        {{ t('ui.addNew') }}
      </Button>
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
          {{ t('ui.createOrganizationUnit') }}
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
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="createLoading"
          @click="submitCreate(async () => {
            listKey++
          })"
        >
          {{ createLoading ? t('ui.creating') : t('ui.create') }}
        </Button>
      </div>
    </div>
  </div>
</template>
