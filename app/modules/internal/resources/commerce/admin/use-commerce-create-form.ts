import { computed, reactive, shallowRef, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import {
  formatPriceAmountInput,
  normalizeLocalizedPriceAmountInput,
  normalizePriceAmountInput,
} from '~/utils/price-format'
import type { ListResponse } from '~/types/api'
import type {
  InternalProduct,
  InternalProductPricing,
} from '~/modules/internal/resources/products/types'

type InternalClientOption = {
  id: string
  name: string
  code: string
}

type AmountField = 'subtotalAmount' | 'discountAmount' | 'taxAmount' | 'totalAmount'

type CurrencyOption = {
  code: string
  name: string
  decimal_places: number
}

type CreateForm = {
  tenantId: string
  internalProductId: string
  internalProductPricingId: string
  currencyCode: string
  subtotalAmount: string
  discountAmount: string
  taxAmount: string
  totalAmount: string
  expiresAt: string
  invoiceDueAt: string
  note: string
}

const createEmptyForm = (): CreateForm => ({
  tenantId: '',
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

export const useCommerceCreateForm = () => {
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { locale, t } = useLocale()

  const createOpen = shallowRef(false)
  const createMode = shallowRef<'quotation' | 'order'>('order')
  const createSaving = shallowRef(false)
  const clientLoading = shallowRef(false)
  const productLoading = shallowRef(false)
  const pricingLoading = shallowRef(false)
  const currencyLoading = shallowRef(false)

  const clients = shallowRef<InternalClientOption[]>([])
  const products = shallowRef<InternalProduct[]>([])
  const pricings = shallowRef<InternalProductPricing[]>([])
  const currencies = shallowRef<CurrencyOption[]>([])

  const createForm = reactive<CreateForm>(createEmptyForm())

  const productOptions = computed(() => products.value.map(product => ({
    value: product.id,
    label: `${product.code} - ${product.name}`,
  })))

  const pricingOptions = computed(() => pricings.value.map(pricing => ({
    value: pricing.id,
    label: `${pricing.code} - ${pricing.name}`,
  })))

  const clientOptions = computed(() => clients.value.map(client => ({
    value: client.id,
    label: `${client.code} - ${client.name}`,
  })))

  const currencyOptions = computed(() => currencies.value.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    decimalPlaces: currency.decimal_places,
  })))

  const selectedCurrencyDecimalPlaces = computed(() => {
    const found = currencies.value.find(c => c.code === createForm.currencyCode)
    return found?.decimal_places ?? 0
  })

  const createTitle = computed(() => (
    createMode.value === 'quotation'
      ? t('ui.createQuotation')
      : t('ui.createOrder')
  ))

  const createAmountModel = (field: AmountField) => {
    return computed<string>({
      get: () => formatPriceAmountInput(createForm[field], locale.value),
      set: (value: string) => {
        createForm[field] = normalizeLocalizedPriceAmountInput(value, locale.value, selectedCurrencyDecimalPlaces.value)
      },
    })
  }

  const subtotalAmountInput = createAmountModel('subtotalAmount')
  const discountAmountInput = createAmountModel('discountAmount')
  const taxAmountInput = createAmountModel('taxAmount')
  const totalAmountInput = createAmountModel('totalAmount')

  const resetCreateForm = () => {
    Object.assign(createForm, createEmptyForm())
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
      query: { paginate: 100 },
    })
    productLoading.value = false

    if (response.success && response.data) {
      products.value = response.data.items ?? []
    }
  }

  const loadClients = async () => {
    if (clients.value.length > 0) {
      if (clients.value.length === 1) {
        createForm.tenantId = clients.value[0]?.id ?? ''
      }
      return
    }

    if (clientLoading.value) {
      return
    }

    clientLoading.value = true
    const response = await apiFetch<ListResponse<InternalClientOption>>('/internal-clients', {
      authMode: 'internal',
      query: { paginate: 100 },
    })
    clientLoading.value = false

    if (response.success && response.data) {
      clients.value = response.data.items ?? []
      if (clients.value.length === 1) {
        createForm.tenantId = clients.value[0]?.id ?? ''
      }
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
        query: { paginate: 100 },
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

  const loadCurrencies = async () => {
    currencyLoading.value = true
    const response = await apiFetch<ListResponse<CurrencyOption>>(
      '/internal-currencies',
      {
        authMode: 'internal',
        query: {
          is_active: true,
          page: 1,
          paginate: 100,
        },
      },
    )
    currencyLoading.value = false

    if (!response.success || !response.data) {
      currencies.value = []
      return
    }

    currencies.value = response.data.items ?? []
    const defaultCurrency = currencies.value.find(c => c.code === 'IDR') ?? currencies.value[0]
    if (defaultCurrency) {
      createForm.currencyCode = defaultCurrency.code
    }
  }

  const openCreateDialog = async (mode: 'quotation' | 'order') => {
    createMode.value = mode
    resetCreateForm()
    createOpen.value = true
    await Promise.all([
      loadClients(),
      loadProducts(),
      loadCurrencies(),
    ])
  }

  const closeCreateDialog = () => {
    if (createSaving.value) {
      return
    }
    createOpen.value = false
    resetCreateForm()
  }

  const submitCreate = async () => {
    const tenantId = createForm.tenantId.trim()
    const productId = createForm.internalProductId.trim()
    const pricingId = createForm.internalProductPricingId.trim()
    const currencyCode = createForm.currencyCode.trim().toUpperCase()

    if (!tenantId || !productId || !pricingId || !currencyCode) {
      show(t('ui.tenantProductPricingAndCurrencyAreRequired'), 'error')
      return
    }

    const body: Record<string, unknown> = {
      tenant_id: tenantId,
      internal_product_id: productId,
      internal_product_pricing_id: pricingId,
      currency_code: currencyCode,
    }

    const invoiceDueAt = toOptionalIso(createForm.invoiceDueAt)
    if (invoiceDueAt) {
      body.invoice_due_at = invoiceDueAt
    }

    if (createMode.value === 'quotation') {
      const subtotalAmount = normalizePriceAmountInput(createForm.subtotalAmount, selectedCurrencyDecimalPlaces.value)
      const discountAmount = normalizePriceAmountInput(createForm.discountAmount, selectedCurrencyDecimalPlaces.value) || '0'
      const taxAmount = normalizePriceAmountInput(createForm.taxAmount, selectedCurrencyDecimalPlaces.value) || '0'
      const totalAmount = normalizePriceAmountInput(createForm.totalAmount, selectedCurrencyDecimalPlaces.value)
      if (!subtotalAmount || !totalAmount) {
        show(t('ui.subtotalAndTotalAmountAreRequired'), 'error')
        return
      }
      body.subtotal_amount = subtotalAmount
      body.discount_amount = discountAmount
      body.tax_amount = taxAmount
      body.total_amount = totalAmount
      body.quote_snapshot = { note: createForm.note.trim() }
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
  }

  return {
    createOpen,
    createMode,
    createSaving,
    createTitle,
    clientLoading,
    productLoading,
    pricingLoading,
    currencyLoading,
    createForm,
    productOptions,
    pricingOptions,
    clientOptions,
    currencyOptions,
    selectedCurrencyDecimalPlaces,
    subtotalAmountInput,
    discountAmountInput,
    taxAmountInput,
    totalAmountInput,
    openCreateDialog,
    closeCreateDialog,
    submitCreate,
  }
}
