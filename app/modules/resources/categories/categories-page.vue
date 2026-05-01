<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import {
  categoryStatusOptionList,
  createCategoryPayload,
  isCategoryStatus,
} from './category-form'

defineOptions({ name: 'CategoriesPage' })
const { t } = useLocale()

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
  { key: 'name', label: t('common.name') },
  { key: 'group', label: t('ui.group') },
  { key: 'status', label: t('ui.status') },
]
const statusOptionList = categoryStatusOptionList

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
  const payload = createCategoryPayload(createForm)
  if (!payload) {
    show(t('ui.nameIsRequired'), 'error')
    return
  }

  createLoading.value = true
  let response

  try {
    response = await apiFetch('/categories', {
      method: 'POST',
      body: payload,
    })
  }
  finally {
    createLoading.value = false
  }

  if (response.success) {
    show(t('ui.categoryCreatedSuccessfully'), 'success')
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
    show(t('ui.editFailedMissingId'), 'error')
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
  editForm.status = isCategoryStatus(status) ? status : 'active'
  return true
}

const submitEdit = async (refreshList: () => Promise<void>, close: () => void) => {
  if (!editId.value) {
    show(t('ui.categoryIdIsMissing'), 'error')
    return
  }
  const payload = createCategoryPayload(editForm)
  if (!payload) {
    show(t('ui.nameIsRequired'), 'error')
    return
  }

  editLoading.value = true
  let response

  try {
    response = await apiFetch(`/categories/${editId.value}`, {
      method: 'PUT',
      body: payload,
    })
  }
  finally {
    editLoading.value = false
  }

  if (response.success) {
    show(t('ui.categoryUpdatedSuccessfully'), 'success')
    await refreshList()
    resetEdit()
    close()
  }
}
</script>

<template>
  <ResourceList
    :key="listKey"
    :title="t('ui.categories')"
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
        {{ t('ui.addNew') }}
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
              {{ t('ui.editCategory') }}
            </div>
            <Button
              variant="outline"
              size="sm"
              :disabled="editLoading || loading"
              @click="close"
            >
              {{ t('ui.close') }}
            </Button>
          </div>
          <div class="mt-4 grid gap-4 text-sm">
            <div
              v-if="loading"
              class="text-muted-foreground"
            >
              {{ t('ui.loading2') }}
            </div>
            <div
              v-else
              class="grid gap-4"
            >
              <div class="grid gap-2">
                <Label for="category-name">{{ t('common.name') }}</Label>
                <Input
                  id="category-name"
                  v-model="editForm.name"
                  :placeholder="t('common.name')"
                />
              </div>
              <div class="grid gap-2">
                <Label for="category-group">{{ t('ui.group') }}</Label>
                <Input
                  id="category-group"
                  v-model="editForm.group"
                  :placeholder="t('ui.group')"
                />
              </div>
              <div class="grid gap-2">
                <Label for="category-parent-id">{{ t('ui.parentId') }}</Label>
                <Input
                  id="category-parent-id"
                  v-model="editForm.parentId"
                  :placeholder="t('ui.parentId')"
                />
              </div>
              <div class="grid gap-2">
                <Label for="category-status">{{ t('ui.status') }}</Label>
                <SearchableSelect
                  id="category-status"
                  v-model="editForm.status"
                  :options="statusOptionList"
                  :placeholder="t('ui.selectStatus')"
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
              {{ t('ui.cancel') }}
            </Button>
            <Button
              size="sm"
              :disabled="editLoading || loading"
              @click="submitEdit(refreshList, close)"
            >
              {{ editLoading ? t('ui.saving') : t('ui.saveChanges') }}
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
          {{ t('ui.createCategory') }}
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="createLoading"
          @click="resetCreate"
        >
          {{ t('ui.close') }}
        </Button>
      </div>
      <div class="mt-4 grid gap-4 text-sm">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="create-category-name">{{ t('common.name') }}</Label>
            <Input
              id="create-category-name"
              v-model="createForm.name"
              :placeholder="t('common.name')"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-category-group">{{ t('ui.group') }}</Label>
            <Input
              id="create-category-group"
              v-model="createForm.group"
              :placeholder="t('ui.group')"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-category-parent-id">{{ t('ui.parentId') }}</Label>
            <Input
              id="create-category-parent-id"
              v-model="createForm.parentId"
              :placeholder="t('ui.parentId')"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-category-status">{{ t('ui.status') }}</Label>
            <SearchableSelect
              id="create-category-status"
              v-model="createForm.status"
              :options="statusOptionList"
              :placeholder="t('ui.selectStatus')"
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
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="createLoading"
          @click="submitCreate"
        >
          {{ createLoading ? t('ui.saving') : t('ui.createCategory') }}
        </Button>
      </div>
    </div>
  </div>
</template>
