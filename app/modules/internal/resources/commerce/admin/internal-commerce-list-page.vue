<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Play } from 'lucide-vue-next'
import {
  buildCommerceActionPayload,
  normalizeCommerceActionPath,
  resolveStatusDescriptor,
} from '../commerce-format'
import type { CommerceAction } from '../types'
import { useDateTime } from '~/composables/useDateTime'
import { formatMoneyAmount } from '~/utils/price-format'
import CommerceCreateDialog from './commerce-create-dialog.vue'

defineOptions({ name: 'InternalCommerceListPage' })

const props = defineProps<{
  resource: 'quotations' | 'orders' | 'invoices'
}>()

const { locale, t } = useLocale()
const { formatReadableDateTime } = useDateTime()

const endpoint = computed(() => `/internal-commerce/${props.resource}`)
const refreshToken = shallowRef(0)
const actionLoadingKey = shallowRef('')
const createDialogRef = shallowRef<InstanceType<typeof CommerceCreateDialog> | null>(null)

const pageTitle = computed(() => {
  const titles = {
    quotations: 'ui.quotations',
    orders: 'ui.orders',
    invoices: 'ui.invoices',
  }
  return t(titles[props.resource])
})

const createButtonMode = computed<'quotation' | 'order' | null>(() => {
  if (props.resource === 'quotations') {
    return 'quotation'
  }
  if (props.resource === 'orders') {
    return 'order'
  }
  return null
})

const formatDate = (value: unknown) => {
  if (typeof value !== 'string' || !value) {
    return '-'
  }
  return formatReadableDateTime(value, undefined, '-')
}

const formatMoney = (amount: unknown, row: Record<string, unknown>) => {
  const currencyCode = typeof row.currency_code === 'string' ? row.currency_code : 'IDR'
  if (typeof amount !== 'string' && typeof amount !== 'number') {
    return '-'
  }
  return formatMoneyAmount(amount, currencyCode, locale.value)
}

const statusToneClass = {
  neutral: 'border-border/70 bg-muted/40 text-foreground',
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
  danger: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
}

const formatStatus = (
  group: 'quotation' | 'order' | 'invoice',
  status: unknown,
) => {
  const descriptor = resolveStatusDescriptor(group, typeof status === 'string' ? status : '')
  return {
    label: t(descriptor.labelKey),
    class: statusToneClass[descriptor.tone],
  }
}

const parseActions = (row: Record<string, unknown> | null | undefined) => {
  const rawActions = row?.available_actions
  return Array.isArray(rawActions) ? rawActions as CommerceAction[] : []
}

const commerceActionLabelKeys: Record<string, string> = {
  approve: 'internalCommerce.actions.approveQuotation',
  approve_quotation: 'internalCommerce.actions.approveQuotation',
  create_order: 'internalCommerce.actions.createOrder',
  continue_to_invoice: 'internalCommerce.actions.continueToInvoice',
  start_payment: 'internalCommerce.actions.startPayment',
  continue_payment: 'internalCommerce.actions.continuePayment',
  retry_payment: 'internalCommerce.actions.retryPayment',
}

const getActionLabel = (action: CommerceAction) => t(commerceActionLabelKeys[action.key] ?? 'ui.action')

const detailLabelKeys: Record<string, string> = {
  amount_outstanding: 'ui.amountOutstanding',
  created_at: 'ui.createdAt',
  currency_code: 'ui.currency',
  due_at: 'ui.dueAt',
  expires_at: 'ui.expiresAt',
  invoice_number: 'ui.invoiceNumber',
  order_number: 'ui.orderNumber',
  quotation_number: 'ui.quotationNumber',
  source_type: 'ui.sourceType',
  status: 'ui.status',
  total_amount: 'ui.totalAmount',
  updated_at: 'ui.updatedAt',
}

const formatDetailLabel = (key: unknown) => {
  if (typeof key !== 'string') {
    return ''
  }
  return detailLabelKeys[key] ? t(detailLabelKeys[key]) : key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

const touchList = () => {
  refreshToken.value += 1
}

const { apiFetch } = useApi()
const { show } = useBanner()

const executeAction = async (
  action: CommerceAction,
  close?: () => void,
) => {
  const path = normalizeCommerceActionPath(action.href)
  if (/^https?:\/\//i.test(path)) {
    window.location.href = path
    return
  }

  if (action.method !== 'POST') {
    return
  }

  const loadingKey = `${action.key}:${action.href}`
  actionLoadingKey.value = loadingKey
  const response = await apiFetch(path, {
    method: 'POST',
    authMode: 'internal',
    body: buildCommerceActionPayload(action),
  })
  actionLoadingKey.value = ''

  if (!response.success) {
    return
  }

  show(t('ui.actionCompletedSuccessfully'), 'success')
  close?.()
  touchList()
}

const columns = computed(() => {
  if (props.resource === 'quotations') {
    return [
      { key: 'quotation_number', label: t('ui.quotationNumber') },
      {
        key: 'status',
        label: t('ui.status'),
        format: (value: unknown) => formatStatus('quotation', value),
      },
      {
        key: 'total_amount',
        label: t('ui.totalAmount'),
        format: formatMoney,
      },
      {
        key: 'expires_at',
        label: t('ui.expiresAt'),
        format: formatDate,
      },
    ]
  }

  if (props.resource === 'orders') {
    return [
      { key: 'order_number', label: t('ui.orderNumber') },
      {
        key: 'status',
        label: t('ui.status'),
        format: (value: unknown) => formatStatus('order', value),
      },
      { key: 'source_type', label: t('ui.sourceType') },
      {
        key: 'created_at',
        label: t('ui.createdAt'),
        format: formatDate,
      },
    ]
  }

  return [
    { key: 'invoice_number', label: t('ui.invoiceNumber') },
    {
      key: 'status',
      label: t('ui.status'),
      format: (value: unknown) => formatStatus('invoice', value),
    },
    {
      key: 'amount_outstanding',
      label: t('ui.amountOutstanding'),
      format: formatMoney,
    },
    {
      key: 'due_at',
      label: t('ui.dueAt'),
      format: formatDate,
    },
  ]
})

const openCreateDialog = (mode: 'quotation' | 'order') => {
  createDialogRef.value?.open()
}

const openCreateDialogFromHeader = () => {
  if (!createButtonMode.value) {
    return
  }
  openCreateDialog(createButtonMode.value)
}
</script>

<template>
  <ResourceList
    :title="pageTitle"
    :endpoint="endpoint"
    :columns="columns"
    :search-key="null"
    :refresh-token="refreshToken"
    loading-variant="skeleton"
    auth-mode="internal"
    :can-delete="false"
    :can-view-detail="true"
  >
    <template #header-actions>
      <div
        v-if="createButtonMode"
        class="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto"
      >
        <Button
          size="sm"
          class="rounded-xl"
          @click="openCreateDialogFromHeader"
        >
          {{ t('ui.addNew') }}
        </Button>
      </div>
    </template>

    <template #row-actions="{ row, close }">
      <button
        v-for="action in parseActions(row)"
        :key="action.key"
        type="button"
        class="w-full rounded px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 md:block"
        :disabled="actionLoadingKey === `${action.key}:${action.href}`"
        @click="executeAction(action, close)"
      >
        {{ getActionLabel(action) }}
      </button>
    </template>

    <template #detail="{ row, loading, entries, formatValue, close }">
      <FormDialogShell
        :title="pageTitle"
        max-width-class="max-w-4xl"
        @close="close"
      >
        <div
          v-if="loading"
          class="text-sm text-muted-foreground"
        >
          {{ t('ui.loading') }}
        </div>
        <div
          v-else
          class="grid gap-5"
        >
          <div class="grid gap-3 rounded-lg border border-border/70 p-4">
            <div
              v-for="[key, value] in entries"
              :key="String(key)"
              class="grid gap-1 text-sm sm:grid-cols-[180px_1fr] sm:gap-4"
            >
              <div class="font-medium text-muted-foreground">
                {{ formatDetailLabel(key) }}
              </div>
              <div class="min-w-0 break-words">
                {{ formatValue(value) }}
              </div>
            </div>
          </div>

          <div
            v-if="parseActions(row).length > 0"
            class="flex flex-wrap justify-end gap-2"
          >
            <Button
              v-for="action in parseActions(row)"
              :key="action.key"
              variant="outline"
              size="sm"
              class="rounded-xl"
              :disabled="actionLoadingKey === `${action.key}:${action.href}`"
              @click="executeAction(action, close)"
            >
              <Play class="h-4 w-4" />
              {{ getActionLabel(action) }}
            </Button>
          </div>
        </div>
      </FormDialogShell>
    </template>
  </ResourceList>

  <CommerceCreateDialog
    v-if="createButtonMode"
    ref="createDialogRef"
    :mode="createButtonMode"
    @created="touchList"
  />
</template>
