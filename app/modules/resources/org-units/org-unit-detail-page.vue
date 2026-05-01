<script setup lang="ts">
import { isOrgUnitCategory } from './org-unit-form-config'
import { useOrgUnitDetailPage } from './use-org-unit-detail-page'

defineOptions({ name: 'OrgUnitDetailPage' })

const { t } = useLocale()

const {
  categoryOptionList,
  editForm,
  goBack,
  loading,
  parentOptions,
  saveChanges,
  saveLoading,
} = useOrgUnitDetailPage()

const handleCategoryUpdate = (value: string) => {
  if (isOrgUnitCategory(value)) {
    editForm.category = value
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <Button
          variant="outline"
          size="sm"
          @click="goBack"
        >
          {{ t('ui.backToList') }}
        </Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ t('ui.editOrganizationUnit') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          v-if="loading"
          class="py-8 text-center text-muted-foreground"
        >
          {{ t('ui.loadingOrgUnit') }}
        </div>

        <OrgUnitDetailForm
          v-else
          :name="editForm.name"
          :category="editForm.category"
          :parent-id="editForm.parent_id"
          :category-options="categoryOptionList"
          :parent-options="parentOptions"
          @update:name="editForm.name = $event"
          @update:category="handleCategoryUpdate"
          @update:parent-id="editForm.parent_id = $event"
        />
      </CardContent>
      <CardFooter class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="saveLoading"
          @click="goBack"
        >
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="saveLoading || loading"
          @click="saveChanges"
        >
          {{ saveLoading ? t('ui.saving') : t('ui.saveChanges') }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
