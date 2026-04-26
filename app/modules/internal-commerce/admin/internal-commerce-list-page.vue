<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { Play, X } from 'lucide-vue-next'
import {
  buildCommerceActionPayload,
  normalizeCommerceActionPath,
  resolveStatusDescriptor,
} from '../commerce-format'
import type { CommerceAction } from '../types'
import { useDateTime } from '~/composables/useDateTime'
import {
  currencyCodes,
  formatMoneyAmount,
  formatPriceAmountInput,
  normalizeLocalizedPriceAmountInput,
  normalizePriceAmountInput,
} from '~/utils/price-format'
import type { ListResponse } from '~/types/api'
import type {
  InternalProduct,
  InternalProductPricing,
} from '~/modules/resources/internal-products/types'

defineOptions({ name: 'InternalCommerceListPage' })

const props = defineProps<{
  resource: 'quotations' | 'orders' | 'invoices'
}>()

const { locale, t } = useLocale()
const { formatReadableDateTime } = useDateTime()
const { apiFetch } = useApi()
const { show } = useBanner()

const endpoint = computed(() => `/internal-commerce/${props.resource}`)
const refreshToken = shallowRef(0)
const createOpen = shallowRef(false)
const createMode = shallowRef<'quotation' | 'order'>('order')
const createSaving = shallowRef(false)
const productLoading = shallowRef(false)
const pricingLoading = shallowRef(false)
const actionLoadingKey = shallowRef('')
const products = shallowRef<InternalProduct[]>([])
const pricings = shallowRef<InternalProductPricing[]>([])

const createForm = reactive({
  internalProductId: '',
  internalProductPricingId: '',
  currencyCode: 'IDR',
  subtotalAmount: '',
  discountAmount: '0',
  taxAmount: '0',
  totalAmount: '',
  expiresAt: '',
  invoiceDueAt: '',
  note: '',
})

type AmountField = 'subtotalAmount' | 'discountAmount' | 'taxAmount' | 'totalAmount'

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

const productOptions = computed(() => products.value.map(product => ({
  value: product.id,
  label: `${product.code} - ${product.name}`,
})))

const pricingOptions = computed(() => pricings.value.map(pricing => ({
  value: pricing.id,
  label: `${pricing.code} - ${pricing.name}`,
})))

const currencyOptions = computed(() => currencyCodes.map(code => ({
  value: code,
  label: t(`internalProducts.prices.currencyOptions.${code}`),
})))

const createTitle = computed(() => (
  createMode.value === 'quotation'
    ? t('ui.createQuotation')
    : t('ui.createOrder')
))

const createAmountModel = (field: AmountField) => computed({
  get: () => formatPriceAmountInput(createForm[field], locale.value),
  set: (value: string) => {
    createForm[field] = normalizeLocalizedPriceAmountInput(value, locale.value)
  },
})

const subtotalAmountInput = createAmountModel('subtotalAmount')
const discountAmountInput = createAmountModel('discountAmount')
const taxAmountInput = createAmountModel('taxAmount')
const totalAmountInput = createAmountModel('totalAmount')

const resetCreateForm = () => {
  createForm.internalProductId = ''
  createForm.internalProductPricingId = ''
  createForm.currencyCode = 'IDR'
  createForm.subtotalAmount = ''
  createForm.discountAmount = '0'
  createForm.taxAmount = '0'
  createForm.totalAmount = ''
  createForm.expiresAt = ''
  createForm.invoiceDueAt = ''
  createForm.note = ''
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

const toOptionalIso = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString()
}

const loadProducts = async () => {
  if (products.value.length > 0 || productLoading.value) {
    return
  }

  productLoading.value = true
  const response = await apiFetch<ListResponse<InternalProduct>>('/internal-products', {
    authMode: 'internal',
    query: {
      paginate: 100,
    },
  })
  productLoading.value = false

  if (response.success && response.data) {
    products.value = response.data.items ?? []
  }
}

const loadPricings = async (productId: string) => {
  if (!productId) {
    pricings.value = []
    createForm.internalProductPricingId = ''
    return
  }

  pricingLoading.value = true
  const response = await apiFetch<ListResponse<InternalProductPricing>>(
    `/internal-products/${productId}/pricings`,
    {
      authMode: 'internal',
      query: {
        paginate: 100,
      },
    },
  )
  pricingLoading.value = false

  if (!response.success || !response.data) {
    pricings.value = []
    createForm.internalProductPricingId = ''
    return
  }

  pricings.value = response.data.items ?? []
  if (!pricings.value.some(pricing => pricing.id === createForm.internalProductPricingId)) {
    createForm.internalProductPricingId = pricings.value[0]?.id ?? ''
  }
}

watch(
  () => createForm.internalProductId,
  productId => loadPricings(productId),
)

const openCreateDialog = async (mode: 'quotation' | 'order') => {
  createMode.value = mode
  resetCreateForm()
  createOpen.value = true
  await loadProducts()
}

const openCreateDialogFromHeader = () => {
  if (!createButtonMode.value) {
    return
  }

  void openCreateDialog(createButtonMode.value)
}

const closeCreateDialog = () => {
  if (createSaving.value) {
    return
  }
  createOpen.value = false
  resetCreateForm()
}

const touchList = () => {
  refreshToken.value += 1
}

const submitCreate = async () => {
  const productId = createForm.internalProductId.trim()
  const pricingId = createForm.internalProductPricingId.trim()
  const currencyCode = createForm.currencyCode.trim().toUpperCase()

  if (!productId || !pricingId || !currencyCode) {
    show(t('ui.productPricingAndCurrencyAreRequired'), 'error')
    return
  }

  const body: Record<string, unknown> = {
    internal_product_id: productId,
    internal_product_pricing_id: pricingId,
    currency_code: currencyCode,
  }

  const invoiceDueAt = toOptionalIso(createForm.invoiceDueAt)
  if (invoiceDueAt) {
    body.invoice_due_at = invoiceDueAt
  }

  if (createMode.value === 'quotation') {
    const subtotalAmount = normalizePriceAmountInput(createForm.subtotalAmount)
    const discountAmount = normalizePriceAmountInput(createForm.discountAmount) || '0'
    const taxAmount = normalizePriceAmountInput(createForm.taxAmount) || '0'
    const totalAmount = normalizePriceAmountInput(createForm.totalAmount)
    if (!subtotalAmount || !totalAmount) {
      show(t('ui.subtotalAndTotalAmountAreRequired'), 'error')
      return
    }
    body.subtotal_amount = subtotalAmount
    body.discount_amount = discountAmount
    body.tax_amount = taxAmount
    body.total_amount = totalAmount
    body.quote_snapshot = {
      note: createForm.note.trim(),
    }
    const expiresAt = toOptionalIso(createForm.expiresAt)
    if (expiresAt) {
      body.expires_at = expiresAt
    }
  }

  createSaving.value = true
  const response = await apiFetch(
    createMode.value === 'quotation'
      ? '/internal-commerce/quotations'
      : '/internal-commerce/orders',
    {
      method: 'POST',
      authMode: 'internal',
      body,
    },
  )
  createSaving.value = false

  if (!response.success) {
    return
  }

  show(
    createMode.value === 'quotation'
      ? t('ui.quotationCreatedSuccessfully')
      : t('ui.orderAndInvoiceCreatedSuccessfully'),
    'success',
  )
  createOpen.value = false
  resetCreateForm()
  touchList()
}

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

  <FormDialogShell
    v-if="createOpen"
    :title="createTitle"
    max-width-class="max-w-3xl"
    @close="closeCreateDialog"
  >
    <form
      class="grid gap-5"
      @submit.prevent="submitCreate"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="grid gap-2">
          <Label for="commerce-product">
            {{ t('ui.product') }}
          </Label>
          <SearchableSelect
            id="commerce-product"
            v-model="createForm.internalProductId"
            :options="productOptions"
            :placeholder="productLoading ? t('ui.loadingProducts') : t('ui.selectProduct')"
            :search-placeholder="t('ui.searchProduct')"
            :disabled="productLoading || createSaving"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-pricing">
            {{ t('ui.pricing') }}
          </Label>
          <SearchableSelect
            id="commerce-pricing"
            v-model="createForm.internalProductPricingId"
            :options="pricingOptions"
            :placeholder="pricingLoading ? t('ui.loadingPricings') : t('ui.selectPricing')"
            :search-placeholder="t('ui.searchPricing')"
            :disabled="pricingLoading || createSaving || !createForm.internalProductId"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-currency">
            {{ t('ui.currency') }}
          </Label>
          <select
            id="commerce-currency"
            v-model="createForm.currencyCode"
            class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="createSaving"
          >
            <option
              v-for="option in currencyOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="grid gap-2">
          <Label for="commerce-invoice-due">
            {{ t('ui.invoiceDueAt') }}
          </Label>
          <Input
            id="commerce-invoice-due"
            v-model="createForm.invoiceDueAt"
            type="datetime-local"
            :disabled="createSaving"
          />
        </div>
      </div>

      <div
        v-if="createMode === 'quotation'"
        class="grid gap-4 sm:grid-cols-2"
      >
        <div class="grid gap-2">
          <Label for="commerce-subtotal">
            {{ t('ui.subtotalAmount') }}
          </Label>
          <Input
            id="commerce-subtotal"
            v-model="subtotalAmountInput"
            inputmode="decimal"
            :disabled="createSaving"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-discount">
            {{ t('ui.discountAmount') }}
          </Label>
          <Input
            id="commerce-discount"
            v-model="discountAmountInput"
            inputmode="decimal"
            :disabled="createSaving"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-tax">
            {{ t('ui.taxAmount') }}
          </Label>
          <Input
            id="commerce-tax"
            v-model="taxAmountInput"
            inputmode="decimal"
            :disabled="createSaving"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-total">
            {{ t('ui.totalAmount') }}
          </Label>
          <Input
            id="commerce-total"
            v-model="totalAmountInput"
            inputmode="decimal"
            :disabled="createSaving"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-expires">
            {{ t('ui.expiresAt') }}
          </Label>
          <Input
            id="commerce-expires"
            v-model="createForm.expiresAt"
            type="datetime-local"
            :disabled="createSaving"
          />
        </div>

        <div class="grid gap-2 sm:col-span-2">
          <Label for="commerce-note">
            {{ t('ui.note') }}
          </Label>
          <textarea
            id="commerce-note"
            v-model="createForm.note"
            class="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="createSaving"
          />
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-4">
        <Button
          type="button"
          variant="outline"
          :disabled="createSaving"
          @click="closeCreateDialog"
        >
          <X class="h-4 w-4" />
          {{ t('ui.cancel') }}
        </Button>
        <Button
          type="submit"
          :disabled="createSaving"
        >
          {{ createSaving ? t('ui.saving') : t('ui.save') }}
        </Button>
      </div>
    </form>
  </FormDialogShell>
</template>
