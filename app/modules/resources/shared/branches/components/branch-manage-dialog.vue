<script setup lang="ts">
import type { BranchFormState } from '../branch-form'
import BranchManageForm from './branch-manage-form.vue'

defineOptions({ name: 'BranchManageDialog' })

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  idPrefix: string
  statusOptions: Array<{ value: string; label: string }>
  loading?: boolean
  saving?: boolean
  submitLabel: string
  savingLabel: string
}>(), {
  loading: false,
  saving: false,
})

const emit = defineEmits<{
  close: []
  submit: []
}>()

const { t } = useLocale()
const form = defineModel<BranchFormState>('form', { required: true })
</script>

<template>
  <FormDialogShell
    v-if="props.open"
    max-width-class="max-w-3xl"
    :title="props.title"
    @close="emit('close')"
  >
    <div
      v-if="props.loading"
      class="text-sm text-muted-foreground"
    >
      {{ t('ui.loading2') }}
    </div>

    <BranchManageForm
      v-else
      v-model:form="form"
      :disabled="props.saving"
      :id-prefix="props.idPrefix"
      :status-options="props.statusOptions"
    />

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="props.loading || props.saving"
          @click="emit('close')"
        >
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="props.loading || props.saving"
          @click="emit('submit')"
        >
          {{ props.saving ? props.savingLabel : props.submitLabel }}
        </Button>
      </div>
    </template>
  </FormDialogShell>
</template>
