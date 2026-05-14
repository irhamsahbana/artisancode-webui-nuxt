<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CrmCategoryGroup } from './crm-category-groups'
import {
  createCategoryColumns,
  formatCategoryDeleteLabel,
  getCategoryDialogDescriptionKey,
  getCategoryListMeta,
} from './categories-view-config'
import { useCategoriesDialog } from './use-categories-dialog'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'CategoriesPage' })

const props = defineProps<{
  categoryGroup: CrmCategoryGroup
}>()

const { t } = useLocale()

const listMeta = computed(() => getCategoryListMeta(props.categoryGroup, t))
const columns = computed(() => createCategoryColumns(props.categoryGroup, t))
const dialogDescription = computed(() => t(getCategoryDialogDescriptionKey(props.categoryGroup)))

const refreshKey = ref(0)
const triggerRefresh = () => {
  refreshKey.value += 1
}

const {
  supportsParent,
  modalOpen,
  modalMode,
  modalLoading,
  submitLoading,
  form,
  parentOptions,
  parentDisplayValue,
  statusOptions,
  openCreateModal,
  openEditModal,
  closeModal,
  handleSubmit,
} = useCategoriesDialog(
  props.categoryGroup,
  {
    apiFetch: useApi().apiFetch,
    t: useLocale().t,
    showBanner: useBanner().show,
  },
  { onSaved: triggerRefresh },
)
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="listMeta.title"
    :endpoint="listMeta.endpoint"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="formatCategoryDeleteLabel"
    :can-view-detail="false"
  >
    <template #header-actions>
      <Button
        size="sm"
        class="rounded-xl"
        @click="openCreateModal"
      >
        {{ t('ui.addNew') }}
      </Button>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ t('ui.edit') }}
      </button>
    </template>
  </ResourceList>

  <div v-if="modalOpen">
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="modalMode === 'create' ? t('ui.createCategory') : t('ui.editCategory')"
      :description="dialogDescription"
      @close="closeModal"
    >
      <div
        v-if="modalLoading"
        class="text-sm text-muted-foreground"
      >
        {{ t('ui.loading2') }}
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <div>
          <Label for="category-name">{{ t('common.name') }} *</Label>
          <Input
            id="category-name"
            v-model="form.name"
            :placeholder="t('common.name')"
            class="mt-1"
          />
        </div>

        <div v-if="supportsParent">
          <Label for="category-parent">{{ t('ui.parent') }}</Label>
          <SearchableTreeSelect
            id="category-parent"
            v-model="form.parentId"
            :items="parentOptions"
            :display-value="parentDisplayValue"
            :placeholder="t('ui.selectParent')"
            :search-placeholder="t('ui.searchCategories')"
            class="mt-1"
          />
        </div>

        <div>
          <Label for="category-status">{{ t('ui.status') }} *</Label>
          <SearchableSelect
            id="category-status"
            v-model="form.status"
            :options="statusOptions"
            :placeholder="t('ui.selectStatus')"
            :search-placeholder="t('ui.searchStatus')"
            class="mt-1"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl"
            :disabled="submitLoading"
            @click="closeModal"
          >
            {{ t('ui.cancel') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="submitLoading"
            type="submit"
          >
            {{ submitLoading ? t('ui.saving') : (modalMode === 'create' ? t('ui.create') : t('ui.update')) }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>
</template>
