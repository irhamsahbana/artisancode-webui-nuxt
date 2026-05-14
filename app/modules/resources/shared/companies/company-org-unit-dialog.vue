<script setup lang="ts">
import type { OrgUnitFormState } from './company-org-unit'

defineOptions({ name: 'CompanyOrgUnitDialog' })

const props = withDefaults(defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  loading?: boolean
  categoryOptions: Array<{ value: string, label: string }>
  parentLabel?: string
}>(), {
  loading: false,
  parentLabel: '',
})

const emit = defineEmits<{
  close: []
  submit: []
}>()

const { t } = useLocale()
const form = defineModel<OrgUnitFormState>('form', { required: true })
</script>

<template>
  <FormDialogShell
    v-if="props.open"
    max-width-class="max-w-xl"
    :title="props.mode === 'create' ? t('company.createOrganizationUnit') : t('company.editOrganizationUnit')"
    @close="emit('close')"
  >
    <div class="grid gap-4 text-sm">
      <div class="grid gap-2">
        <Label for="company-org-unit-code">{{ t('company.organizationUnitCode') }}</Label>
        <Input
          id="company-org-unit-code"
          v-model="form.code"
          :placeholder="t('company.organizationUnitCodePlaceholder')"
          :disabled="props.loading"
        />
      </div>
      <div class="grid gap-2">
        <Label for="company-org-unit-name">{{ t('company.organizationUnitName') }}</Label>
        <Input
          id="company-org-unit-name"
          v-model="form.name"
          :placeholder="t('company.organizationUnitNamePlaceholder')"
          :disabled="props.loading"
        />
      </div>
      <div class="grid gap-2">
        <Label for="company-org-unit-category">{{ t('company.organizationUnitCategory') }}</Label>
        <SearchableSelect
          id="company-org-unit-category"
          v-model="form.category"
          :disabled="props.loading"
          :options="props.categoryOptions"
          :placeholder="t('common.selectCategory')"
        />
      </div>
      <div
        v-if="props.parentLabel"
        class="text-xs text-muted-foreground"
      >
        {{ props.parentLabel }}
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="props.loading"
          @click="emit('close')"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="props.loading"
          @click="emit('submit')"
        >
          {{ props.loading ? t('common.saving') : (props.mode === 'create' ? t('common.create') : t('common.save')) }}
        </Button>
      </div>
    </template>
  </FormDialogShell>
</template>
