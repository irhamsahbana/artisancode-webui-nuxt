<script setup lang="ts">
import { computed, ref } from 'vue'
import InternalCurrencyManageDialog from './internal-currency-manage-dialog.vue'
import { createInternalCurrencyColumns, formatInternalCurrencyDeleteLabel } from './internal-currency-list'
import { useInternalCurrencyManager } from './use-internal-currency-manager'

defineOptions({ name: 'InternalCurrenciesPage' })

const { t } = useLocale()

const refreshKey = ref(0)

const triggerRefresh = () => {
  refreshKey.value += 1
}

const manager = useInternalCurrencyManager(triggerRefresh)
const {
  dialogOpen,
  dialogMode,
  saving,
  form,
  openCreateDialog,
  openEditDialog,
  closeDialog,
  submitForm,
  toggleActive,
  setDefault,
} = manager

const columns = computed(() => createInternalCurrencyColumns({ t }))

const openEditModal = async (row: Record<string, unknown>) => {
  const code = String(row.code ?? '')
  if (!code) {
    return
  }

  openEditDialog({
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    symbol: String(row.symbol ?? ''),
    decimal_places: Number(row.decimal_places ?? 2),
    is_active: Boolean(row.is_active),
    is_default: Boolean(row.is_default),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  })
}
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="t('billingSettings.currencies.title')"
    endpoint="/internal-currencies"
    :columns="columns"
    :search-key="null"
    loading-variant="skeleton"
    :can-view-detail="false"
    auth-mode="internal"
    :delete-label-formatter="formatInternalCurrencyDeleteLabel"
  >
    <template #header-actions>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <Button
          size="sm"
          class="rounded-xl"
          @click="openCreateDialog"
        >
          {{ t('ui.addNew') }}
        </Button>
      </div>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ t('ui.manage') }}
      </button>
      <button
        v-if="!row.is_default"
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); setDefault({
          code: String(row.code ?? ''),
          name: String(row.name ?? ''),
          symbol: String(row.symbol ?? ''),
          decimal_places: Number(row.decimal_places ?? 2),
          is_active: Boolean(row.is_active),
          is_default: Boolean(row.is_default),
          created_at: String(row.created_at ?? ''),
          updated_at: String(row.updated_at ?? ''),
        })"
      >
        {{ t('billingSettings.currencies.setDefault') }}
      </button>
      <button
        v-if="!(row.is_default && row.is_active)"
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); toggleActive({
          code: String(row.code ?? ''),
          name: String(row.name ?? ''),
          symbol: String(row.symbol ?? ''),
          decimal_places: Number(row.decimal_places ?? 2),
          is_active: Boolean(row.is_active),
          is_default: Boolean(row.is_default),
          created_at: String(row.created_at ?? ''),
          updated_at: String(row.updated_at ?? ''),
        })"
      >
        {{ row.is_active ? t('billingSettings.currencies.deactivate') : t('billingSettings.currencies.activate') }}
      </button>
    </template>
  </ResourceList>

  <InternalCurrencyManageDialog
    :open="dialogOpen"
    :mode="dialogMode"
    :saving="saving"
    :form="form"
    @close="closeDialog"
    @submit="submitForm"
    @update:form="Object.assign(form, $event)"
  />
</template>
