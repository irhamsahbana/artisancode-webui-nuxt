<script setup lang="ts">
import { ref } from 'vue'
import {
  branchColumns,
  branchStatusOptionList,
  createBranchPayload,
  createEmptyBranchForm,
  formatBranchDeleteLabel,
  getBranchRowId,
  resetBranchForm,
  syncBranchForm,
} from './branch-form'
import BranchManageDialog from './components/branch-manage-dialog.vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'BranchesPage' })
const { t } = useLocale()

const listKey = ref(0)
const createOpen = ref(false)
const createLoading = ref(false)
const editLoading = ref(false)
const editId = ref<string | null>(null)
const createForm = ref(createEmptyBranchForm())
const editForm = ref(createEmptyBranchForm())

const { apiFetch } = useApi()
const { show } = useBanner()

const resetCreate = () => {
  createOpen.value = false
  createLoading.value = false
  resetBranchForm(createForm.value)
}

const openCreate = () => {
  createOpen.value = true
}

const resetEdit = () => {
  editLoading.value = false
  editId.value = null
  resetBranchForm(editForm.value)
}

const submitCreate = async () => {
  const payload = createBranchPayload(createForm.value)
  if (!payload) {
    show(t('ui.nameAndCityAreRequired'), 'error')
    return
  }

  createLoading.value = true

  try {
    const response = await apiFetch('/branches', {
      method: 'POST',
      body: payload,
    })

    if (response.success) {
      show(t('ui.branchCreated'), 'success')
      resetCreate()
      listKey.value += 1
    }
  }
  finally {
    createLoading.value = false
  }
}

const syncEditForm = (row: Record<string, unknown> | null) => {
  if (!row) {
    return false
  }
  const id = getBranchRowId(row)
  if (!id) {
    show(t('ui.editFailedMissingId'), 'error')
    return false
  }
  if (editId.value === id) {
    return true
  }
  editId.value = id
  syncBranchForm(editForm.value, row)
  return true
}

const submitEdit = async (refreshList: () => Promise<void>, close: () => void) => {
  if (!editId.value) {
    show(t('ui.branchIdIsMissing'), 'error')
    return
  }
  const payload = createBranchPayload(editForm.value)
  if (!payload) {
    show(t('ui.nameAndCityAreRequired'), 'error')
    return
  }

  editLoading.value = true

  try {
    const response = await apiFetch(`/branches/${editId.value}`, {
      method: 'PUT',
      body: payload,
    })

    if (response.success) {
      show(t('ui.branchUpdated'), 'success')
      await refreshList()
      resetEdit()
      close()
    }
  }
  finally {
    editLoading.value = false
  }
}
</script>

<template>
  <ResourceList
    :key="listKey"
    :title="t('ui.branches')"
    endpoint="/branches"
    :columns="branchColumns"
    loading-variant="skeleton"
    :delete-label-formatter="formatBranchDeleteLabel"
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
      <BranchManageDialog
        v-if="syncEditForm(row)"
        v-model:form="editForm"
        :open="true"
        :title="t('ui.editBranch')"
        id-prefix="branch"
        :loading="loading"
        :saving="editLoading"
        :status-options="branchStatusOptionList"
        :submit-label="t('ui.saveChanges')"
        :saving-label="t('ui.saving')"
        @close="close"
        @submit="submitEdit(refreshList, close)"
      />
    </template>
  </ResourceList>
  <BranchManageDialog
    v-model:form="createForm"
    :open="createOpen"
    :title="t('ui.createBranch')"
    id-prefix="create-branch"
    :saving="createLoading"
    :status-options="branchStatusOptionList"
    :submit-label="t('ui.createBranch')"
    :saving-label="t('ui.saving')"
    @close="resetCreate"
    @submit="submitCreate"
  />
</template>
